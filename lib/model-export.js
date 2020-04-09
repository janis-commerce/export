'use strict';

const Model = require('@janiscommerce/model');

class ModelExport extends Model {

	static get table() {
		return 'exports';
	}

	static get statuses() {
		return {
			pending: 'pending',
			processing: 'processing',
			processed: 'processed',
			sending: 'sending',
			sent: 'sent',
			sendingError: 'sending-error'
		};
	}
}

module.exports = ModelExport;
