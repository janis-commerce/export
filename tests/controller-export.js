'use strict';

const assert = require('assert');
const { ControllerExport } = require('../lib/index');

describe('Controller', () => {

	describe('Export', () => {

		describe('Getters', () => {

			it('Should return the correct page limit', () => {
				assert.strictEqual(ControllerExport.prototype.pageLimit, 5000);
			});

			it('Should return the correct file limit', () => {
				assert.strictEqual(ControllerExport.prototype.fileLimit, 25000);
			});

			it('Should return the correct list of fields', () => {
				assert.deepStrictEqual(ControllerExport.prototype.fields, []);
			});

			it('Should return the correct list of exclude fields', () => {
				assert.deepStrictEqual(ControllerExport.prototype.excludeFields, []);
			});
		});

	});

});
