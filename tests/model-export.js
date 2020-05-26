'use strict';

const assert = require('assert');
const { ModelExport } = require('../lib/index');

describe('Models', () => {

	describe('Export', () => {

		describe('Getters', () => {

			it('Should return the correct table', () => {
				assert.strictEqual(ModelExport.table, 'exports');
			});

			it('Should return the correct statuses', () => {
				assert.deepStrictEqual(ModelExport.statuses, {
					created: 'created',
					processed: 'processed',
					sent: 'sent',
					sendingError: 'sending-error'
				});
			});

			it('Should return false', () => {
				assert.strictEqual(ModelExport.shouldCreateLogs, false);
			});
		});
	});
});
