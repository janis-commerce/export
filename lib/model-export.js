'use strict';

const Model = require('@janiscommerce/model');

class ModelExport extends Model {

	static get table() {
		return 'exports';
	}
}

module.exports = ModelExport;
