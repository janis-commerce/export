'use strict';

const assert = require('assert');
const { ExportFormatters } = require('../lib/index');

const falsyCases = [undefined, null, false, 0, ''];

describe('ExportFormatters', () => {

	describe('formatDate', () => {

		it('Should return the correct value formatting date', () => {
			const date = new Date();
			const expected = date.toLocaleString();

			assert.strictEqual(ExportFormatters.formatDate(date.toISOString()), expected);
			assert.strictEqual(ExportFormatters.formatDate(date.getTime()), expected);
		});

		it('Should return null if pass falsy value formatting date', () => {
			falsyCases.forEach(value => {
				assert.deepStrictEqual(ExportFormatters.formatDate(value), null);
			});
		});

	});

	describe('formatUser', () => {

		it('Should return the correct value formatting user', () => {
			const cases = [
				[{ firstname: 'John', lastname: 'Doe', email: 'john@mail.com' }, 'John Doe (john@mail.com)'],
				[{ firstname: 'John', email: 'john@mail.com' }, 'John - (john@mail.com)'],
				[{ lastname: 'Doe', email: 'john@mail.com' }, '- Doe (john@mail.com)'],
				[{ firstname: 'John', lastname: 'Doe' }, 'John Doe (-)'],
				[{ email: 'john@mail.com' }, '- - (john@mail.com)'],
				[{}, '- - (-)']
			];

			cases.forEach(([value, expected]) => {
				assert.deepStrictEqual(ExportFormatters.formatUser(value), expected);
			});
		});

		it('Should return null if pass falsy value formatting user', () => {
			falsyCases.forEach(value => {
				assert.deepStrictEqual(ExportFormatters.formatUser(value), null);
			});
		});

	});


	describe('formatListBy', () => {

		it('Should return the correct value formatting entity ids', () => {
			const cases = [[
				['5e7ce95a1eaaf60007215fa', '5e7ce95a1eaaf60007215fb'],
				[
					{ id: '5e7ce95a1eaaf60007215fa', name: 'someNameOne' },
					{ id: '5e7ce95a1eaaf60007215fb', name: 'someNameTwo' }
				],
				'name',
				'someNameOne, someNameTwo'
			],
			[
				['5e7ce95a1eaaf60007215fa', '5e7ce95a1eaaf60007215fb'],
				[
					{ id: '5e7ce95a1eaaf60007215fa', name: 'someNameOne' },
					{ id: '5e7ce95a1eaaf60007215fc', name: 'someNameTwo' }
				],
				'name',
				'someNameOne'
			],
			[
				['5e7ce95a1eaaf60007215fa', '5e7ce95a1eaaf60007215fb'],
				[
					{ id: '5e7ce95a1eaaf60007215fc', name: 'someNameOne' },
					{ id: '5e7ce95a1eaaf60007215fd', name: 'someNameTwo' }
				],
				'name',
				''
			]];

			cases.forEach(([list, entities, field, expected]) => {
				assert.deepStrictEqual(ExportFormatters.formatListBy(list, entities, field), expected);
			});
		});

	});

});
