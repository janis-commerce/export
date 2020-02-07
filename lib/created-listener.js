'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const logger = require('lllog')();

const ApiExportValidator = require('./api-export-validator');
const ModelExport = require('./model-export');

const { processedEvent } = require('./helpers/event-emitters');

class CreatedListener extends EventListener {

	get exportModel() {
		/* istanbul ignore else */
		if(!this._exportModel)
			this._exportModel = this.session.getSessionInstance(ModelExport);

		return this._exportModel;
	}

	get mustHaveClient() {
		return true;
	}

	get mustHaveId() {
		return true;
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

		const exportDocument = await this.exportModel.getById(this.eventId);

		if(!exportDocument) {
			logger.info(`No Export document ID: ${this.eventId} was found.`);
			return;
		}

		await this.preProcess(exportDocument);

		const apiExportValidator = new ApiExportValidator(this);
		const controller = apiExportValidator.validateController(exportDocument.entity);

		exportDocument.files = await controller.generateAndUploadFiles(exportDocument);

		await this.exportModel.save(exportDocument);

		await this.postProcess(exportDocument);

		return processedEvent(this.eventId, this.session.clientCode);
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

module.exports = CreatedListener;
