'use strict';

const { struct } = require('superstruct');
const path = require('path');

const ApiExportError = require('./api-export-error');

const filterStruct = struct('string | number | array');

const sortDirectionsStruct = struct.enum(['asc', 'desc', 'ASC', 'DESC']);

class ApiExportValidator {

	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	validateData() {

		if(this.apiInstance.dataToSave.main.filters)
			this.validateFilters(this.apiInstance.dataToSave.main.filters);

		if(this.apiInstance.dataToSave.main.sortDirection)
			this.validateSortDirection(this.apiInstance.dataToSave.main.sortDirection);
	}

	validateFilters(filters) {

		Object.values(filters).forEach(filter => {
			filterStruct(filter);
		});
	}

	validateSortDirection(direction) {
		sortDirectionsStruct(direction);
	}

	validateModel(entity) {
		try {
			return this._getModelInstance(path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity));
		} catch(e) {
			throw new ApiExportError(e, ApiExportError.codes.INVALID_MODEL);
		}
	}

	validateController(entity) {
		try {
			return this._getModelInstance(path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', entity));
		} catch(e) {
			throw new ApiExportError(e, ApiExportError.codes.INVALID_CONTROLLER);
		}
	}

	_getModelInstance(modelPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		const Model = require(modelPath);

		if(!this.apiInstance.session)
			return new Model();

		return this.apiInstance.session.getSessionInstance(Model);
	}
}

module.exports = ApiExportValidator;
