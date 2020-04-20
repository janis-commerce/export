'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const { Mail, MailError } = require('@janiscommerce/mail');

const logger = require('lllog')();

const ExportValidator = require('./helpers/validator');

class ProcessedListener extends EventListener {

	get exportValidator() {
		if(!this._apiExportValidator)
			this._apiExportValidator = new ExportValidator(this);

		return this._apiExportValidator;
	}

	get exportModel() {
		if(!this._exportModel)
			this._exportModel = this.exportValidator.validateModel('export');

		return this._exportModel;
	}

	get statuses() {
		return this.exportModel.constructor.statuses;
	}

	get mustHaveClient() {
		return true;
	}

	get mustHaveId() {
		return true;
	}

	async process() {

		const isExportProcessed = await this.exportModel.update({ status: this.statuses.sending }, { id: this.eventId, status: this.statuses.processed });

		if(!isExportProcessed)
			return true;

		const exportDocument = await this.exportModel.getById(this.eventId, {
			filters: {
				status: this.statuses.sending
			}
		});

		if(!exportDocument || !exportDocument.files) {
			logger.info(`Can't find document or files to export with ID: ${this.eventId} with ${this.statuses.sending} state.`);
			return;
		}

		try {

			await this.sendEmail(exportDocument);

			await this.exportModel.update({ status: this.statuses.sent }, { id: this.eventId, status: this.statuses.sending });

			logger.info(`Email sent to ${exportDocument.userEmail} with export document ID: ${this.eventId}.`);

		} catch(error) {

			await this.exportModel.update({ status: this.statuses.sendingError }, { id: this.eventId, status: this.statuses.sending });

			if(error.code && error.code === MailError.codes.MS_CALL_ERROR)
				throw error;

			logger.error(`Fail to send Export ID: ${this.eventId}, data to ${exportDocument.userEmail}. ${error.message}`);
		}
	}

	async sendEmail({ userEmail, entity, files, id }) {

		const controller = this.exportValidator.validateController(entity);

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
