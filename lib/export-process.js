'use strict';

const { Mail } = require('@janiscommerce/mail'); // MailError ??? agregar
const logger = require('lllog')();
const InstanceGetter = require('./helpers/instance-getter');
const { exportProcessStruct } = require('./helpers/structs');


class ExportProcess {

	get mustHaveClient() {
		return true;
	}

	get mustHavePayload() {
		return true;
	}

	get instanceGetter() {
		if(!this._instanceGetter)
			this._instanceGetter = this.session.getSessionInstance(InstanceGetter);

		return this._instanceGetter;
	}

	get exportModel() {
		if(!this._exportModel)
			this._exportModel = this.instanceGetter.getModel('export');

		return this._exportModel;
	}

	get statuses() {
		return this.exportModel.constructor.statuses;
	}

	async validate() {

		exportProcessStruct(this.data);
	}

	/**
	 * Do something before Start processing Data
	 * @async
	 *
	 * @param {Object} exportDocument Export Document Before Processing
	 */
	async preProcess(exportDocument) {
		return exportDocument;
	}

	async process() {

		const { exportDocument } = this.data;
		const { id } = this.data.exportDocument;

		await this.updateStatus(id, this.statuses.processing, this.statuses.pending);

		await this.preProcess(exportDocument);
		this.controller = this.instanceGetter.getController(exportDocument.entity);
		const files = await this.controller.generateAndUploadFiles(exportDocument);
		await this.postProcess(exportDocument);
		await this.exportModel.save({ ...exportDocument, status: this.statuses.processed, files });

		try {

			await this.sendEmail({ ...exportDocument, files });
			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${id}.`);

		} catch(error) {

			await this.exportModel.save({ ...exportDocument, error: error.message, status: this.statuses.sendingError, files });
			logger.error(`Fail to send Export ID: ${id}, data to ${exportDocument.userEmail}. ${error.message}`);
			return;
		}

		await this.updateStatus(id, this.statuses.sent, this.statuses.processed);
	}

	async updateStatus(id, newStatus, previousStatus) {

		const updateStatus = await this.exportModel.update({ status: newStatus }, { id, status: previousStatus });

		if(!updateStatus) {
			const errorMessage = `Fail to update export ID: ${id}`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	async sendEmail({ userEmail, entity, files, id }) {

		if(!files.length) {
			logger.info(`Can not find files to export with ID: ${id}`);
			return;
		}

		const dataToSend = {
			userEmail,
			entity,
			files: await this.controller.getFilesPaths(files)
		};

		return this.session.getSessionInstance(Mail)
			.setTemplateCode('export')
			.setData(dataToSend)
			.setEntity('export')
			.setEntityId(id)
			.send();
	}

	/**
	 * Do Something after process
	 * @async
	 *
	 * @param {object} exportDocumentSaved Export Document Processed
	 */
	async postProcess(exportDocumentSaved) {
		return exportDocumentSaved;
	}
}

module.exports = ExportProcess;
