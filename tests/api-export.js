'use strict';

const ApiTest = require('@janiscommerce/api-test');
const MsCall = require('@janiscommerce/microservice-call');
const { Invoker } = require('@janiscommerce/lambda');
const mockRequire = require('mock-require');
const path = require('path');

const { ApiExport, ModelExport, ControllerExport } = require('../lib');

describe('API Export', () => {

	const exportDocument = {
		entity: 'some-entity',
		filters: { name: 'some', status: 'active' },
		sortBy: 'name',
		sortDirection: 'desc'
	};

	const exportData = {
		userEmail: 'user@email.com',
		status: ModelExport.statuses.pending
	};

	const exportId = '5e0a0619bcc3ce0007a18011';

	const exportModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'export');
	const fakeModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'some-entity');
	const fakeControllerPath = path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', 'some-entity');

	class FakeModel {}
	class FakeController extends ControllerExport {}

	context('When Fields are Missing', () => {

		ApiTest(ApiExport, '/api/export', [
			{
				description: 'Should return 400 if the required field \'entity\' is not passed',
				request: {
					data: { filters: { name: 'some', status: 'active' } }
				},
				session: true,
				response: {
					code: 400
				}
			}
		]);
	});

	context('When Fields are Wrong', () => {

		const makeWrongInput = field => {

			const data = { ...exportDocument };
			data[field] = { invalid: field };
			return data;
		};

		const samples = [
			['entity', makeWrongInput('entity')],
			['sortBy', makeWrongInput('sortBy')],
			['sortDirection', makeWrongInput('sortDirection')],
			['filters', { entity: 'some-entity', filters: { name: { invalid: 'name' } } }]
		];

		samples.forEach(([field, data]) => {
			ApiTest(ApiExport, '/api/export', [
				{
					description: `Should return 400 if the required field '${field}' is Invalid`,
					request: {
						data
					},
					session: true,
					response: {
						code: 400
					}
				}
			]);
		});
	});

	context('When no Entity Model exists', () => {

		before(() => {
			mockRequire(exportModelPath, ModelExport);
			mockRequire(fakeControllerPath, FakeController);
		});

		after(() => {
			mockRequire.stop(exportModelPath);
			mockRequire.stop(fakeControllerPath);
		});

		ApiTest(ApiExport, '/api/export', [
			{
				description: 'Should return 400',
				request: {
					data: exportDocument
				},
				session: true,
				response: {
					code: 400
				}
			}
		]);
	});

	context('When no Entity Controller exists', () => {

		before(() => {
			mockRequire(exportModelPath, ModelExport);
			mockRequire(fakeModelPath, FakeModel);
		});

		after(() => {
			mockRequire.stop(fakeModelPath);
			mockRequire.stop(exportModelPath);
		});


		ApiTest(ApiExport, '/api/export', [
			{
				description: 'Should return 400',
				request: {
					data: exportDocument
				},
				session: true,
				response: {
					code: 400
				}
			}
		]);
	});

	context('When Fields are Valid', () => {

		before(() => {
			mockRequire(exportModelPath, ModelExport);
			mockRequire(fakeModelPath, FakeModel);
			mockRequire(fakeControllerPath, FakeController);
		});

		after(() => {
			mockRequire.stop(exportModelPath);
			mockRequire.stop(fakeModelPath);
			mockRequire.stop(fakeControllerPath);
		});

		ApiTest(ApiExport, '/api/export', [
			{
				description: 'Should return 500 if Microservice Call Fails',
				request: {
					data: exportDocument
				},
				session: true,
				response: { code: 500 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').rejects(new Error('MsCall Error (500): Internal Error'));
					sandbox.stub(ModelExport.prototype);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.notCalled(ModelExport.prototype.insert);
					sandbox.assert.notCalled(Invoker.clientCall);

					sandbox.assert.calledOnceWithExactly(MsCall.prototype.call, 'id', 'user', 'get', null, null, { id: 2 });
				}
			},
			{
				description: 'Should return 500 if Microservice Call Response Incorrectly',
				request: {
					data: exportDocument
				},
				session: true,
				response: { code: 500 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ user: { id: 2 } });
					sandbox.stub(ModelExport.prototype);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.notCalled(ModelExport.prototype.insert);
					sandbox.assert.notCalled(Invoker.clientCall);
				}
			},
			{
				description: 'Should return 500 if User found has no email',
				request: {
					data: exportDocument
				},
				session: true,
				response: { code: 500 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ body: { id: 2 } });
					sandbox.stub(ModelExport.prototype);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.notCalled(ModelExport.prototype.insert);
					sandbox.assert.notCalled(Invoker.clientCall);
				}
			},
			{
				description: 'Should return 200 if Export Document is saved correctly',
				request: {
					data: exportDocument
				},
				session: true,
				response: { code: 200 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ body: { id: 2, email: 'user@email.com' } });
					sandbox.stub(ModelExport.prototype, 'insert').returns(exportId);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {

					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.insert, { ...exportDocument, ...exportData, userCreated: 2 });
					sandbox.assert.calledOnceWithExactly(Invoker.clientCall, 'ExportProcess', 'defaultClient',
						{ exportDocument: { id: exportId, ...exportDocument, ...exportData, userCreated: 2 } });
				}
			},
			{
				description: 'Should return 200 if Export Document is saved correctly with only entity name',
				request: {
					data: {
						entity: 'some-entity'
					}
				},
				session: true,
				response: { code: 200 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ body: { id: 2, email: 'user@email.com' } });
					sandbox.stub(ModelExport.prototype, 'insert').returns(exportId);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {

					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnce(Invoker.clientCall);
					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.insert, {
						entity: 'some-entity',
						...exportData,
						userCreated: 2
					});
				}
			},
			{
				description: 'Should return 200 if Export Document saved has no sort direction and use default',
				request: {
					data: {
						entity: 'some-entity',
						filters: { name: 'some', status: 'active' },
						sortBy: 'name'
					}
				},
				session: true,
				response: { code: 200 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ body: { id: 2, email: 'user@email.com' } });
					sandbox.stub(ModelExport.prototype, 'insert').returns(exportId);
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {

					const exportDocumentFormatted = { ...exportDocument, sortDirection: 'asc' };
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnceWithExactly(Invoker.clientCall, 'ExportProcess', 'defaultClient',
						{ exportDocument: { id: exportId, ...exportData, ...exportDocumentFormatted, userCreated: 2 } });
					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.insert, { ...exportDocumentFormatted, ...exportData, userCreated: 2 });
				}
			}
		]);
	});
});
