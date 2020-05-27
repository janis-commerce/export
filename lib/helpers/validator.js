'use strict';

const MsCall = require('@janiscommerce/microservice-call');
const { sortDirectionsStruct } = require('./structs');
const InstanceGetter = require('./instance-getter');

class ExportValidator {

	get instanceGetter() {

		if(!this._instanceGetter)
			this._instanceGetter = this.session.getSessionInstance(InstanceGetter);

		return this._instanceGetter;
	}

	validate({ entity, sortDirection, sortBy, ...dataToValidate }) {

		this.validateController(entity);
		this.validateModel(entity);
		sortDirection = this.validateSortDirection(sortDirection, sortBy);

		return {
			...dataToValidate,
			entity,
			...sortDirection && { sortDirection },
			...sortBy && { sortBy }
		};
	}

	validateModel(entity) {
		return this.instanceGetter.getModel(entity);
	}

	validateController(entity) {
		return this.instanceGetter.getController(entity);
	}

	validateSortDirection(sortDirection, sortBy) {

		if(sortBy && !sortDirection)
			return 'asc';


		if(sortBy && sortDirection)
			sortDirectionsStruct(sortDirection);

		return sortDirection;
	}

	async validateEmail() {

		const userEmail = await this.getUserEmail(this.session.userId);

		if(!userEmail)
			throw new Error('Invalid User');

		return userEmail;
	}

	async getUserEmail(id) {

		const response = await this.session.getSessionInstance(MsCall).call('id', 'user', 'get', null, null, { id });
		return response.body && response.body.email;
	}

}

module.exports = ExportValidator;
