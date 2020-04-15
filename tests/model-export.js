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
					pending: 'pending',
					processing: 'processing',
					processed: 'processed',
					sending: 'sending',
					sent: 'sent',
					sendingError: 'sending-error'
				});
			});
		});
	});
});
