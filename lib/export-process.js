'use strict';

const { Mail, MailError } = require('@janiscommerce/mail'); // MailError ??? agregar
const logger = require('lllog')();
const InstanceGetter = require('./helpers/instance-getter');


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

		const exportDocument = this.data;
		const { id } = this.data;

		await this.preProcess(exportDocument);
		this.controller = this.instanceGetter.getController(exportDocument.entity);
		const files = await this.controller.generateAndUploadFiles(exportDocument);
		await this.postProcess(exportDocument);
		await this.exportModel.save({ ...exportDocument, status: this.statuses.processed, files });

		try {

			await this.sendEmail({ ...exportDocument, files });
			await this.exportModel.update({ status: this.statuses.sent }, { id, status: this.statuses.processed });
			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${id}.`);

		} catch(error) {

			await this.exportModel.update({ status: this.statuses.sendingError }, { id, status: this.statuses.processed });

			if(error.code && error.code === MailError.codes.MS_CALL_ERROR)
				throw error;

			logger.error(`Fail to send Export ID: ${id}, data to ${exportDocument.userEmail}. ${error.message}`);
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
