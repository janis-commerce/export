'use strict';

const Model = require('@janiscommerce/model');

class Export extends Model {

	static get table() {
		return 'exports';
	}

	static get statuses() {
		return {
			pending: 'pending',
			processing: 'processing',
			processed: 'processed',
			sent: 'sent',
			sendingError: 'sending-error'
		};
	}

	static get shouldCreateLogs() {
		return false;
	}
}

module.exports = Export;
