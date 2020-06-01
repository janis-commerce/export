'use strict';

const { ApiSaveData } = require('@janiscommerce/api-save');
const { Invoker } = require('@janiscommerce/lambda');
const ExportValidator = require('./helpers/validator');
const { exportApiStruct } = require('./helpers/structs');

class ApiExport extends ApiSaveData {

	static get mainStruct() {
		return exportApiStruct;
	}

	get statuses() {
		return this.model.constructor.statuses;
	}

	async validate() {

		await super.validate();
		this.exportValidator = this.session.getSessionInstance(ExportValidator);
		this.dataToSave.main = this.exportValidator.validate(this.dataToSave.main);
	}

	async format(exportDocument) {

		const userEmail = await this.exportValidator.validateEmail();

		return {
			...exportDocument,
			userEmail,
			userCreated: this.session.userId,
			status: this.statuses.pending
		};
	}

	postSaveHook(id, dataSaved) {
		return Invoker.clientCall('ExportProcess', this.session.clientCode, { exportDocument: { id, ...dataSaved } });
	}
}

module.exports = ApiExport;
