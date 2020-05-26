'use strict';

const { ApiSaveData } = require('@janiscommerce/api-save');
const { Invoker } = require('@janiscommerce/lambda');
const ExportValidator = require('./helpers/validator');
const { exportStruct } = require('./helpers/structs');

class ApiExport extends ApiSaveData {

	static get mainStruct() {
		return exportStruct;
	}

	get statuses() {
		return this.model.constructor.statuses;
	}

	async validate() {

		await super.validate();
		this.exportValidator = this.session.getSessionInstance(ExportValidator);
		this.dataToSave.main = await this.exportValidator.validate(this.dataToSave.main);
	}

	async format({ userId, ...exportDocument }) {

		const userEmail = await this.exportValidator.validateEmail();

		this.exportDocument = exportDocument;
		this.exportData = {
			userEmail,
			userId,
			status: this.statuses.created
		};

		return {
			exportDocument: this.exportDocument,
			exportData: this.exportData
		};
	}

	postSaveHook(id, dataSaved) {
		return Invoker.clientCall('ExportProcess', this.session.clientCode, { id, ...dataSaved });
	}
}

module.exports = ApiExport;
