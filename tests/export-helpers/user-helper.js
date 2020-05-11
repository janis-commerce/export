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

	const expectedData = {
		'5e7ce95a1eaaf60007215f5b': { id: '5e7ce95a1eaaf60007215f5b' },
		'5e7ce95a1eaaf60007215f5d': { id: '5e7ce95a1eaaf60007215f5d' },
		'5e7ce95a1eaaf60007215ff': { id: '5e7ce95a1eaaf60007215ff' }
	};

	describe('getUsers', () => {

		beforeEach(() => {
			sinon.restore();
		});


		it('Should return a expected data if request success', async () => {
			const getIdsSpy = sinon.spy(UserHelper, 'getIds');

			sinon.stub(MsCall.prototype, 'safeList').resolves({ body: Object.values(expectedData) });

			const data = await UserHelper.getUsers(itemsExample, { getSessionInstance: MSCALL => new MSCALL() });

			assert(getIdsSpy.returned(Object.keys(expectedData)));
			sinon.assert.match(data, expectedData);
			sinon.assert.calledOnce(MsCall.prototype.safeList);
		});


		it('Should return a empty object if not exist users ids', async () => {
			const getIdsSpy = sinon.spy(UserHelper, 'getIds');

			sinon.stub(MsCall.prototype, 'safeList');

			const data = await UserHelper.getUsers([
				{
					id: '5e7ce95a1eaaf60007215f5b',
					userCreated: null,
					userModified: null
				},
				{ id: '5e7ce95a1eaaf60007215f5b' }
			], {});

			assert(getIdsSpy.returned([]));
			sinon.assert.match(data, {});
			sinon.assert.notCalled(MsCall.prototype.safeList);
		});


		it('Should return a empty object if fail request', async () => {
			const getIdsSpy = sinon.spy(UserHelper, 'getIds');

			sinon.stub(MsCall.prototype, 'safeList').resolves({ statusCode: 500 });

			const data = await UserHelper.getUsers(itemsExample, { getSessionInstance: MSCALL => new MSCALL() });

			assert(getIdsSpy.returned(Object.keys(expectedData)));
			sinon.assert.match(data, {});
			sinon.assert.calledOnce(MsCall.prototype.safeList);
		});

	});

});
