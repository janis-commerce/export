'use strict';

const { ApiSaveData, ApiSaveError } = require('@janiscommerce/api-save');
const MsCall = require('@janiscommerce/microservice-call');

const ModelExport = require('./model-export');
const ApiExportValidator = require('./api-export-validator');
const ApiExportError = require('./api-export-error');

const { exportStruct } = require('./helpers/structs');
const { createdEvent } = require('./helpers/event-emitters');
const { exportFormatter } = require('./helpers/formatters');

class ApiExport extends ApiSaveData {

	get msCall() {
		/* istanbul ignore else */
		if(!this._msCall)
			this._msCall = this.session.getSessionInstance(MsCall);

		return this._msCall;
	}

	static get mainStruct() {
		return exportStruct;
	}

	async validate() {

		try {
			await super.validate();

		} catch(error) {

			if(error.name !== ApiSaveError.name || error.code !== ApiSaveError.codes.INVALID_ENTITY)
				throw error;

			this.model = this.session.getSessionInstance(ModelExport);
		}

		const apiExportValidator = new ApiExportValidator(this);

		apiExportValidator.validateData();
		apiExportValidator.validateModel(this.dataToSave.main.entity);
		apiExportValidator.validateController(this.dataToSave.main.entity);

		process.env.JANIS_SERVICE_SECRET = '300ee07e-676b-4a37-a4fc-d8ac3f05261d';
	}

	async format(document) {

		const userEmail = await this.getUserEmail(this.session.userId);

		if(!userEmail)
			throw new ApiExportError('Invalid User', ApiExportError.codes.INVALID_USER);

		return exportFormatter(document, this.session.userId, userEmail);
	}

	async getUserEmail(id) {
		try {
			const response = await this.msCall.get('id', 'user', 'get', null, null, { id });

			if(!response.body || !response.body.email)
				return undefined;

			return response.body.email;

		} catch(error) {
			throw new ApiExportError(error, ApiExportError.codes.MS_CALL_ERROR);
		}
	}

	postSaveHook(id) {
		return createdEvent(id, this.session.clientCode);
	}
}

module.exports = ApiExport;
