'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const { Mail, MailError } = require('@janiscommerce/mail');

const logger = require('lllog')();

const ModelExport = require('./model-export');
const ApiExportValidator = require('./api-export-validator');

class ProcessedListener extends EventListener {

	get exportModel() {
		/* istanbul ignore else */
		if(!this._exportModel)
			this._exportModel = this.session.getSessionInstance(ModelExport);

		return this._exportModel;
	}

	get mailService() {
		/* istanbul ignore else */
		if(!this._mailService)
			this._mailService = this.session.getSessionInstance(Mail);

		return this._mailService;
	}

	get mustHaveClient() {
		return true;
	}

	get mustHaveId() {
		return true;
	}

	async process() {

		const exportDocument = await this.exportModel.getById(this.eventId);

		if(!exportDocument || !exportDocument.files) {
			logger.info(`No document or files to export with ID: ${this.eventId} was found.`);
			return;
		}

		try {

			await this.sendEmail(exportDocument);

			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${this.eventId}.`);

		} catch(error) {

			if(error.code && error.code === MailError.codes.MS_CALL_ERROR)
				throw error;

			logger.error(`Fail to send Export ID: ${this.eventId}, data to ${exportDocument.userEmail}. ${error.message}`);
		}
	}

	async sendEmail({ userEmail, entity, files }) {

		const apiExportValidator = new ApiExportValidator(this);
		const controller = apiExportValidator.validateController(entity);

		const dataToSend = {
			files: await controller.getFilesPaths(files)
		};

		return this.mailService.setTo(userEmail)
			.setSubject(`${entity} Export Files`)
			.setEntity(entity)
			.setData(dataToSend)
			.setTemplateCode('export')
			.send();

	}
}

module.exports = ProcessedListener;
