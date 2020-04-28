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

		describe('Formatters', () => {

			it('Should return the correct value formatting date', () => {
				const date = new Date();

				assert.strictEqual(ControllerExport.formatDate(date.toISOString()), date.toLocaleString());
				assert.strictEqual(ControllerExport.formatDate(date.getTime()), date.toLocaleString());
			});

			it('Should return null if pass falsy value formatting date', () => {
				[undefined, null, false, 0, ''].forEach(value => {
					assert.deepStrictEqual(ControllerExport.formatDate(value), null);
				});
			});

			it('Should return the correct value formatting user', () => {
				const caseOne = [{ firstname: 'John', lastname: 'Doe', email: 'john@mail.com' }, 'John Doe (john@mail.com)'];
				const caseTwo = [{ firstname: 'John', email: 'john@mail.com' }, 'John - (john@mail.com)'];
				const caseThree = [{ lastname: 'Doe', email: 'john@mail.com' }, '- Doe (john@mail.com)'];
				const caseFour = [{ firstname: 'John', lastname: 'Doe' }, 'John Doe (-)'];
				const caseFive = [{ email: 'john@mail.com' }, '- - (john@mail.com)'];

				[caseOne, caseTwo, caseThree, caseFour, caseFive, [{}, '- - (-)']].forEach(([value, expected]) => {
					assert.deepStrictEqual(ControllerExport.formatUser(value), expected);
				});
			});

			it('Should return null if pass falsy value formatting user', () => {
				[undefined, null, false, 0, ''].forEach(value => {
					assert.deepStrictEqual(ControllerExport.formatUser(value), null);
				});
			});
		});
	});
});
