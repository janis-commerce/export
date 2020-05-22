'use strict';

const ApiTest = require('@janiscommerce/api-test');
const MsCall = require('@janiscommerce/microservice-call');
const { Invoker } = require('@janiscommerce/lambda');

const mockRequire = require('mock-require');
const path = require('path');

const { ApiExport, ModelExport, ControllerExport } = require('../lib');

describe('API Export', () => {

	const exportData = {
		entity: 'some-entity',
		filters: { name: 'some', status: 'active' },
		sortBy: 'name',
		sortDirection: 'desc'
	};

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

			const data = { ...exportData };
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

	context('When no Entity Model exist', () => {

		before(() => {
			mockRequire(exportModelPath, ModelExport);
		});

		after(() => {
			mockRequire.stop(exportModelPath);
		});

		ApiTest(ApiExport, '/api/export', [
			{
				description: 'Should return 400',
				request: {
					data: exportData
				},
				session: true,
				response: {
					code: 400
				}
			}
		]);
	});

	context('When no Entity Controller exist', () => {

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
					data: exportData
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
					data: exportData
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
					data: exportData
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
					data: exportData
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
					data: exportData
				},
				session: true,
				response: { code: 200 },
				before: sandbox => {
					sandbox.stub(MsCall.prototype, 'call').returns({ body: { id: 2, email: 'user@email.com' } });
					sandbox.stub(ModelExport.prototype, 'insert').returns('export-1');
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnce(ModelExport.prototype.insert);
					sandbox.assert.calledOnce(Invoker.clientCall);

					const formattedExportData = {
						entity: 'some-entity',
						filters: { name: 'some', status: 'active' },
						sortBy: 'name',
						sortDirection: 'desc',
						userCreated: 2,
						userEmail: 'user@email.com',
						status: ModelExport.statuses.pending
					};
					sandbox.assert.calledWithExactly(ModelExport.prototype.insert, formattedExportData);

					sandbox.assert.calledWithExactly(Invoker.clientCall, 'ExportProcess', 'defaultClient', formattedExportData);
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
					sandbox.stub(ModelExport.prototype, 'insert').returns('export-1');
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnce(ModelExport.prototype.insert);
					sandbox.assert.calledOnce(Invoker.clientCall);

					sandbox.assert.calledWithExactly(ModelExport.prototype.insert, {
						entity: 'some-entity',
						userCreated: 2,
						userEmail: 'user@email.com',
						status: ModelExport.statuses.pending
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
					sandbox.stub(ModelExport.prototype, 'insert').returns('export-1');
					sandbox.stub(Invoker, 'clientCall');
				},
				after: (response, sandbox) => {
					sandbox.assert.calledOnce(MsCall.prototype.call);
					sandbox.assert.calledOnce(ModelExport.prototype.insert);
					sandbox.assert.calledOnce(Invoker.clientCall);

					sandbox.assert.calledWithExactly(ModelExport.prototype.insert, {
						entity: 'some-entity',
						filters: { name: 'some', status: 'active' },
						sortBy: 'name',
						sortDirection: 'asc',
						userCreated: 2,
						userEmail: 'user@email.com',
						status: ModelExport.statuses.pending
					});
				}
			}
		]);
	});
});
