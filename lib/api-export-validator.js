'use strict';

const path = require('path');

const { filterStruct, sortDirectionsStruct } = require('./helpers/structs');

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

		const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', entity);

		try {
			return this._getInstance(modelPath);
		} catch(e) {
			throw new Error(`Invalid Model ${entity}. Must be in ${modelPath}.`);
		}
	}

	validateController(entity) {

		const controllerPath = path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', entity);

		try {
			return this._getInstance(controllerPath);
		} catch(e) {
			throw new Error(`Invalid Controller ${entity}. Must be in ${controllerPath}.`);
		}
	}

	_getInstance(classPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		const TheClass = require(classPath);

		return this.apiInstance.session.getSessionInstance(TheClass);
	}
}

module.exports = ApiExportValidator;
