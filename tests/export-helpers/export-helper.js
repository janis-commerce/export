'use strict';

const sinon = require('sinon');
const { ExportHelper } = require('../../lib/index');

describe('ExportHelper', () => {

	const itemsExample = [{
		id: '5e7ce95a1eaaf60007215f5a',
		userId: '5e7ce95a1eaaf60007215f5b'
	}, {
		id: '5e7ce95a1eaaf60007215fc',
		userId: '5e7ce95a1eaaf60007215f5d'
	}, {
		id: '5e7ce95a1eaaf60007215fe',
		userId: '5e7ce95a1eaaf60007215f5d'
	}, {
		id: '5e7ce95a1eaaf60007215ff',
		userId: ['5e7ce95a1eaaf60007215fg']
	}, {
		id: '5e7ce95a1eaaf60007215fh',
		userId: null
	}];

	class EntityHelper extends ExportHelper {

		static getEntityFieldIds(items) {
			this.items = items;

			const userIds = this.getIds('userId');

			return userIds;
		}

	}

	describe('getIds', () => {

		it('Should return a specific array', () => {
			const data = EntityHelper.getEntityFieldIds(itemsExample);
			sinon.assert.match(data, [
				'5e7ce95a1eaaf60007215f5b',
				'5e7ce95a1eaaf60007215f5d',
				'5e7ce95a1eaaf60007215fg'
			]);
		});

		it('Should return a empty array', () => {
			const data = EntityHelper.getEntityFieldIds([{ userid: null }, { userid: '' }]);
			sinon.assert.match(data, []);
		});

	});

	describe('mapIdToEntity', () => {

		it('Should return a specific object', () => {
			sinon.assert.match(EntityHelper.mapIdToEntity(itemsExample), {
				'5e7ce95a1eaaf60007215f5a': {
					id: '5e7ce95a1eaaf60007215f5a',
					userId: '5e7ce95a1eaaf60007215f5b'
				},
				'5e7ce95a1eaaf60007215fc': {
					id: '5e7ce95a1eaaf60007215fc',
					userId: '5e7ce95a1eaaf60007215f5d'
				},
				'5e7ce95a1eaaf60007215fe': {
					id: '5e7ce95a1eaaf60007215fe',
					userId: '5e7ce95a1eaaf60007215f5d'
				},
				'5e7ce95a1eaaf60007215ff': {
					id: '5e7ce95a1eaaf60007215ff',
					userId: ['5e7ce95a1eaaf60007215fg']
				},
				'5e7ce95a1eaaf60007215fh': {
					id: '5e7ce95a1eaaf60007215fh',
					userId: null
				}
			});
		});

	});
});
