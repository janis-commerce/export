'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const Mail = require('@janiscommerce/mail');

const logger = require('lllog')();

const ModelExport = require('./model-export');

const MailMsCallError = 4;

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

		if(!exportDocument) {
			logger.info(`No Export document ID: ${this.eventId} was found.`);
			return;
		}

		if(!exportDocument.files) {
			logger.info(`No Files to Export document ID: ${this.eventId} was found.`);
			return;
		}

		try {

			await this.sendEmail(exportDocument);
			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${this.eventId}.`);

		} catch(error) {

			if(error.code && error.code === MailMsCallError)
				throw error;

			logger.error(`Fail to send Export ID: ${this.eventId}, data to ${exportDocument.userEmail}. ${error.message}`);
		}
	}

	sendEmail({ userEmail, entity, files }) {

		return this.mailService.setTo(userEmail)
			.setSubject(`${entity} Export Files`)
			.setEntity(entity)
			.setData(files)
			.setTemplateCode('export')
			.send();

	}
}

module.exports = ProcessedListener;
