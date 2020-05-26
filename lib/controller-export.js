'use strict';

const S3 = require('@janiscommerce/s3');
const ExcelJS = require('exceljs');

const InstanceGetter = require('./helpers/instance-getter');

const author = 'JANIS';
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

	get fileUrlExpirationTime() {
		return 86400;
	}

	formatFilters(filters) {
		return filters;
	}

	async generateAndUploadFiles(exportDocument) {

		this.init(exportDocument);

		const initialItems = await this.getItemsByPage(1);

		if(!initialItems.length)
			return [];

		await this.setTotals();

		return Promise.all(Array(this.filesQuantity).fill()
			.map(async (filePart, index) => {

				const pageStart = (index * this.pagesPerFile) + 1;
				let pageEnd = ((index + 1) * this.pagesPerFile);
				pageEnd = pageEnd > this.totalPages ? this.totalPages : pageEnd;

				const items = pageStart === 1 ?
					[...initialItems, ...await this.getItems(2, pageEnd)] :
					await this.getItems(pageStart, pageEnd);

				const fileBuffer = await this.makeExcel(index + 1, items);

				return this.uploadToS3(index + 1, fileBuffer);
			}));
	}

	init({
		entity, userCreated, userEmail, id, ...exportDocument
	}) {
		this.entity = entity;
		this.userId = userCreated;
		this.userEmail = userEmail;
		this.exportId = id;

		this.filters = exportDocument.filters;
		this.sortBy = exportDocument.sortBy;
		this.sortDirection = exportDocument.sortDirection;

		const instanceGetter = this.session.getSessionInstance(InstanceGetter);
		this.model = instanceGetter.getModel(entity);
	}

	async getItems(pageStart, pageEnd) {

		const totalPages = pageEnd - pageStart + 1;

		const items = await Promise.all(Array(totalPages).fill()
			.map((item, index) => this.getItemsByPage(index + pageStart), []));

		return this.formatByFile(items.reduce((acum, page) => [...acum, ...page], []));
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

	async getItemsByPage(page) {

		const items = await this.model.get({
			filters: !!this.filters && this.formatFilters(this.filters),
			order: {
				[this.sortBy]: this.sortDirection
			},
			page,
			limit: this.pageLimit
		});

		const formattedItems = this.format ? await Promise.all(items.map(item => this.format(item))) : items;

		return this.formatByPage(formattedItems);
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
		this.pagesPerFile = Math.ceil(this.fileLimit / this.pageLimit);
		this.filesQuantity = Math.ceil(this.totalPages / this.pagesPerFile);
	}

	async makeExcel(partNumber, dataset) {

		const workbook = new ExcelJS.Workbook();

		workbook.creator = author;
		workbook.created = new Date();

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

		const headers = new Set();

		dataset.forEach(data => {
			Object.keys(data).forEach(field => headers.add(field));
		});

		if(this.excludeFields && this.excludeFields.length)
			this.excludeFields.forEach(exclude => headers.delete(exclude));

		return [...headers];
	}

	async uploadToS3(partNumber, file) {

		const filename = `exports/${this.session.clientCode}/${this.userId}/${this.entity}-${this.exportId}-part${partNumber}.xlsx`;

		await S3.putObject({
			Bucket: bucket,
			Key: filename,
			Body: file
		});

		return filename;
	}

	getFilesPaths(filenames) {

		return Promise.all(filenames.map(filename => S3.getSignedUrl('getObject', {
			Bucket: bucket,
			Key: filename,
			Expires: this.fileUrlExpirationTime
		})));
	}
}

module.exports = ControllerExport;
