'use strict';

const { Mail } = require('@janiscommerce/mail'); // MailError ??? agregar
const logger = require('lllog')();
const InstanceGetter = require('./instance-getter');


class ExportProcess {

	get mustHaveClient() {
		return true;
	}

	get mustHavePayload() {
		return true;
	}

	get instaceGetter() {
		if(!this._instanceGetter)
			this._instanceGetter = this.session.getSessionInstace(InstanceGetter);

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

		const { exportDocument, exportData } = this.data;
		const { id } = this.data;

		await this.preProcess(exportDocument);
		this.controller = this.instaceGetter.getController(exportDocument.entity);
		const files = await this.controller.generateAndUploadFiles(exportDocument);
		await this.postProcess(exportDocument);
		await this.exportModel.save({ status: this.statuses.processed, files }, { id, status: this.statuses.created });

		try {

			await this.sendEmail(exportData.userEmail, exportDocument.entity, files, this.data.id);
			await this.exportModel.update({ status: this.statuses.sent }, { id, status: this.statuses.processed });
			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${id}.`);

		} catch(error) {

			await this.exportModel.update({ status: this.statuses.sendingError }, { id, status: this.statuses.processed });
			logger.error(`Fail to send Export ID: ${id}, data to ${exportDocument.userEmail}. ${error.message}`);
		}
	}

	async sendEmail(userEmail, entity, files, id) {

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
