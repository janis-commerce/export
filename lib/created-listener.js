'use strict';

const {
	EventListener
} = require('@janiscommerce/event-listener');

const logger = require('lllog')();

const ApiExportValidator = require('./api-export-validator');

const { processedEvent } = require('./helpers/event-emitters');

class CreatedListener extends EventListener {

	get apiExportValidator() {
		if(!this._apiExportValidator)
			this._apiExportValidator = new ApiExportValidator(this);

		return this._apiExportValidator;
	}

	get exportModel() {
		if(!this._exportModel)
			this._exportModel = this.apiExportValidator.validateModel('export');

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

		const isExportPending = await this.exportModel.update({ status: this.statuses.processing }, { id: this.eventId, status: this.statuses.pending });

		if(!isExportPending) {
			logger.info(`Can't update status for export document ID: ${this.eventId}.`);
			return true;
		}

		const exportDocument = await this.exportModel.getById(this.eventId, {
			filters: {
				status: this.statuses.processing
			}
		});

		if(!exportDocument) {
			logger.info(`Can't find export document ID: ${this.eventId} with ${this.statuses.processing} state.`);
			return;
		}

		await this.preProcess(exportDocument);

		const controller = this.apiExportValidator.validateController(exportDocument.entity);

		exportDocument.files = await controller.generateAndUploadFiles(exportDocument);

		await this.exportModel.save({ ...exportDocument, status: this.statuses.processed });

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
