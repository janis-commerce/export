'use strict';

const assert = require('assert');
const { ControllerExport } = require('../lib/index');

describe('Controller', () => {

	describe('Export', () => {

		describe('Getters', () => {

			it('Should return the correct table', () => {
				assert.strictEqual(ControllerExport.prototype.pageLimit, 5000);
			});

			it('Should return the correct table', () => {
				assert.strictEqual(ControllerExport.prototype.fileLimit, 25000);
			});

			it('Should return the correct table', () => {
				assert.deepStrictEqual(ControllerExport.prototype.excludeField, []);
			});
		});
	});
});
