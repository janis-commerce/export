'use strict';

const assert = require('assert');
const sinon = require('sinon');
const MsCall = require('@janiscommerce/microservice-call');
const { UserHelper } = require('../../lib/index');

describe('UserHelper', () => {

	const itemsExample = [{
		id: '5e7ce95a1eaaf60007215f5a',
		userCreated: '5e7ce95a1eaaf60007215f5b',
		userModified: null
	}, {
		id: '5e7ce95a1eaaf60007215fc',
		userCreated: '5e7ce95a1eaaf60007215f5d',
		userModified: '5e7ce95a1eaaf60007215f5d'
	}, {
		id: '5e7ce95a1eaaf60007215fe',
		userCreated: '5e7ce95a1eaaf60007215f5d',
		userModified: '5e7ce95a1eaaf60007215ff'
	}, {
		id: '5e7ce95a1eaaf60007215fi',
		userCreated: null,
		userModified: null
	}];

	describe('getUsers', () => {

		it('Should return a expected data', async () => {
			const expectedData = {
				'5e7ce95a1eaaf60007215f5b': { id: '5e7ce95a1eaaf60007215f5b' },
				'5e7ce95a1eaaf60007215f5d': { id: '5e7ce95a1eaaf60007215f5d' },
				'5e7ce95a1eaaf60007215ff': { id: '5e7ce95a1eaaf60007215ff' }
			};

			const getIdsSpy = sinon.spy(UserHelper, 'getIds');

			sinon.stub(MsCall.prototype, 'safeList').resolves(Object.values(expectedData));

			const data = await UserHelper.getUsers(itemsExample, {});

			assert(getIdsSpy.returned(Object.keys(expectedData)));

			sinon.assert.match(data, expectedData);

		});

	});

});
