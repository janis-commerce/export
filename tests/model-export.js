'use strict';

const assert = require('assert');
const { ModelExport } = require('../lib/index');

describe('Models', () => {

	describe('Export', () => {

		describe('Getters', () => {

			it('Should return the correct table', () => {
				assert.strictEqual(ModelExport.table, 'exports');
			});
		});
	});
});
