'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const { Mail, MailError } = require('@janiscommerce/mail');

const logger = require('lllog')();

const ApiExportValidator = require('./api-export-validator');

class ProcessedListener extends EventListener {

	get apiExportValidator() {
		if(!this._apiExportValidator)
			this._apiExportValidator = new ApiExportValidator(this);

		return this._apiExportValidator;
	}

	get mustHaveClient() {
		return true;
	}

	get mustHaveId() {
		return true;
	}

	async process() {

		const exportDocument = await this.apiExportValidator.validateModel('export').getById(this.eventId);

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

	async sendEmail({ userEmail, entity, files, id }) {

		const controller = this.apiExportValidator.validateController(entity);

		const dataToSend = {
			userEmail,
			entity,
			files: await controller.getFilesPaths(files)
		};

		return this.session.getSessionInstance(Mail)
			.setTemplateCode('export')
			.setData(dataToSend)
			.setEntity('export')
			.setEntityId(id)
			.send();
	}
}

module.exports = ProcessedListener;
