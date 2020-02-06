'use strict';

const { ApiSaveData } = require('@janiscommerce/api-save');
const MsCall = require('@janiscommerce/microservice-call');

const ApiExportValidator = require('./api-export-validator');

const { exportStruct } = require('./helpers/structs');
const { createdEvent } = require('./helpers/event-emitters');
const { exportFormatter } = require('./helpers/formatters');

class ApiExport extends ApiSaveData {

	static get mainStruct() {
		return exportStruct;
	}

	async validate() {

		await super.validate();

		const apiExportValidator = new ApiExportValidator(this);

		apiExportValidator.validateData();
		apiExportValidator.validateModel(this.dataToSave.main.entity);
		apiExportValidator.validateController(this.dataToSave.main.entity);
	}

	async format(document) {

		const userEmail = await this.getUserEmail(this.session.userId);

		if(!userEmail)
			throw new Error('Invalid User');

		return exportFormatter(document, this.session.userId, userEmail);
	}

	async getUserEmail(id) {
		const response = await this.session.getSessionInstance(MsCall).get('id', 'user', 'get', null, null, { id });

		return response.body && response.body.email;
	}

	postSaveHook(id) {
		return createdEvent(id, this.session.clientCode);
	}
}

module.exports = ApiExport;
