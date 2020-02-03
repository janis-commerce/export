'use strict';

const S3 = require('@janiscommerce/s3');
const ExcelJS = require('exceljs');

const ApiExportValidator = require('./api-export-validator');

const author = 'Janis';
const bucket = `janis-${process.env.JANIS_SERVICE_NAME}-service-${process.env.JANIS_ENV}`;

class ControllerExport {

	get pageLimit() {
		return 5000;
	}

	get fileLimit() {
		return 25000;
	}

	get fields() {
		return [];
	}

	get excludeFields() {
		return [];
	}

	async generateAndUploadFiles(exportDocument) {

		this.init(exportDocument);

		const initialItems = await this.getItemByPage(1);

		if(!initialItems.length)
			return [];

		await this.setTotals();

		return Promise.all(Array(this.fileParts).fill()
			.map(async (filePart, index) => {

				const pageStart = (index * this.filePages) + 1;
				let pageEnd = ((index + 1) * this.filePages);
				pageEnd = pageEnd > this.totalPages ? this.totalPages : pageEnd;

				const items = pageStart === 1 ?
					[...initialItems, ...await this.getItems(2, pageEnd)] :
					await this.getItems(pageStart, pageEnd);

				const fileBuffer = await this.makeExcel(index + 1, items);

				return this.uploadToS3(index + 1, fileBuffer);
			}));
	}

	init({ entity, userCreated, userEmail, ...exportDocument }) {
		this.entity = entity;
		this.userId = userCreated;
		this.userEmail = userEmail;

		this.filters = exportDocument.filters;
		this.sortBy = exportDocument.sortBy;
		this.sortDirection = exportDocument.sortDirection;

		const apiExportValidator = new ApiExportValidator(this);
		this.model = apiExportValidator.validateModel(entity);
	}

	async getItems(pageStart, pageEnd) {

		const totalPages = pageEnd - pageStart + 1;

		const items = await Promise.all(Array(totalPages).fill()
			.map((item, index) => this.getItemByPage(index + pageStart),
				[]));

		return this.formatByFile(items.reduce((acum, item) => [...acum, ...item], []));
	}

	/**
	 * Format Items before make a File, override it to customize formatting
	 * @async
	 *
	 * @param {Object.<array>} items List of Items before make File
	 * @returns {Object.<array>} Formatted Objects to make File
	 */
	async formatByFile(items) {
		return items;
	}

	async getItemByPage(page) {

		const items = await this.model.get({
			filters: this.filters,
			order: {
				[this.sortBy]: this.sortDirection
			},
			page,
			limit: this.pageLimit
		});

		const formattedItems = await Promise.all(items.map(item => this.format(item)));

		return this.formatByPage(formattedItems);
	}

	/**
     * Format Item individually, override it to customize formatting
     * @async
     *
     * @param {Object} item
     * @returns {Object} Formatted item
     */
	async format(item) {
		return item;
	}

	/**
     * Format Items, override it to customize formatting
     * @async
     *
     * @param {Object.<array>} items List of items in a Page
     * @returns {Object.<array>} Formatted Objects
     */
	async formatByPage(items) {
		return items;
	}

	async setTotals() {

		const { pages } = await this.model.getTotals();

		this.totalPages = pages;
		this.filePages = Math.ceil(this.fileLimit / this.pageLimit);
		this.fileParts = Math.ceil(this.totalPages / this.filePages);
	}

	async makeExcel(partNumber, dataset) {

		const workbook = new ExcelJS.Workbook();

		workbook.creator = author;
		workbook.lastModifiedBy = author;
		workbook.created = new Date();
		workbook.modified = new Date();

		const worksheet = workbook.addWorksheet(`${this.entity}-part${partNumber}`);

		const headers = this.getExcelHeaders(dataset);

		worksheet.columns = headers.map(header => ({
			header: header.toUpperCase(),
			key: header
		}));

		worksheet.addRows(dataset);

		return workbook.xlsx.writeBuffer();
	}

	getExcelHeaders(dataset) {

		if(this.fields && this.fields.length)
			return this.fields;

		const headers = [];

		dataset.forEach(data => {
			headers.push(...Object.keys(data));
		});

		return [...new Set(headers)].filter(header => !this.excludeFields.includes(header));
	}

	async uploadToS3(partNumber, file) {

		const filename = `exports/${this.session.clientCode}/${this.userCreated}/${this.entity}-part${partNumber}.xlsx`;

		await S3.putObject({
			Bucket: bucket,
			Key: filename,
			Body: file
		});

		return filename;
	}

	getFilesPaths(filenames) {

		return filenames.reduce((filesToSend, filename, index) => {
			filesToSend[`file-part-${index + 1}`] = `https://s3.amazonaws.com/${bucket}/${filename}`;
			return filesToSend;
		}, {});
	}
}

module.exports = ControllerExport;
