// 'use strict';

// const EventEmitter = require('@janiscommerce/event-emitter');
// const Model = require('@janiscommerce/model');
// const S3 = require('@janiscommerce/s3');
// const ExcelJS = require('exceljs');
// const assert = require('assert');

// const logger = require('lllog');
// const mockRequire = require('mock-require');
// const path = require('path');

// logger('none');

// const { ServerlessHandler } = require('@janiscommerce/event-listener');
// const EventListenerTest = require('@janiscommerce/event-listener-test');

// const { CreatedListener, ModelExport, ControllerExport } = require('../lib/index');

// const handler = (...args) => ServerlessHandler.handle(CreatedListener, ...args);

// describe('Created Export Listener', async () => {

// 	const validEvent = {
// 		service: 'some-service',
// 		client: 'defaultClient',
// 		entity: 'export',
// 		event: 'processed',
// 		id: 'export-doc-1'
// 	};

// 	const exportDocument = {
// 		id: validEvent.id,
// 		entity: 'cat',
// 		filters: { legs: 4, isOld: 1 },
// 		sortBy: 'bornYear',
// 		sortDirection: 'desc',
// 		userCreated: 'terrier-1',
// 		userEmail: 'dogs@revenge.com'
// 	};

// 	const makeItems = quantity => Array(quantity).fill()
// 		.map((item, index) => ({
// 			id: index,
// 			legs: 4,
// 			bornYear: 2019,
// 			eyes: 2,
// 			isOld: true
// 		}));

// 	const fakeModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'cat');
// 	const fakeControllerPath = path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', 'cat');
// 	const exportModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'export');

// 	class FakeModel extends Model {}

// 	context('When Controller has no include fields or exclude', async () => {

// 		class FakeController extends ControllerExport {
// 			get pageLimit() {
// 				return 1;
// 			}

// 			get fileLimit() {
// 				return 2;
// 			}

// 			formatFilters(filters) {
// 				const forceBoolean = value => !(value === 'false' || value === '0' || !value);

// 				if(filters.isOld) {
// 					return {
// 						...filters,
// 						isOld: forceBoolean(filters.isOld)
// 					};
// 				}

// 				return filters;
// 			}
// 		}

// 		before(() => {
// 			mockRequire(fakeModelPath, FakeModel);
// 			mockRequire(fakeControllerPath, FakeController);
// 			mockRequire(exportModelPath, ModelExport);
// 		});

// 		after(() => {
// 			mockRequire.stop(fakeModelPath);
// 			mockRequire.stop(fakeControllerPath);
// 			mockRequire.stop(exportModelPath);
// 		});

// 		await EventListenerTest(handler, [
// 			{
// 				description: 'Should return 400 if the event has no client',
// 				session: true,
// 				event: {
// 					...validEvent,
// 					client: undefined
// 				},
// 				responseCode: 400
// 			},
// 			{
// 				description: 'Should return 400 if the event has no ID',
// 				session: true,
// 				event: {
// 					...validEvent,
// 					id: undefined
// 				},
// 				responseCode: 400
// 			},
// 			{
// 				description: 'Should return 200 if the export document cannot be found',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([]);
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.update,
// 						{ status: ModelExport.statuses.processing },
// 						{ id: validEvent.id, status: ModelExport.statuses.pending }
// 					);
// 					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.get, { filters: { id: validEvent.id, status: ModelExport.statuses.processing } });
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			},
// 			{
// 				description: 'Should return 200 if can\'t update the export document status',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(false);
// 					sandbox.stub(ModelExport.prototype, 'get');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.notCalled(ModelExport.prototype.get);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			},
// 			{
// 				description: 'Should return 500 but used preProcess method',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.stub(CreatedListener.prototype, 'preProcess').rejects(new Error('Some Error'));
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 500
// 			},
// 			{
// 				description: 'Should return 200 when no files to generate',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.stub(FakeModel.prototype, 'get').returns([]);

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.postProcess);

// 					sandbox.assert.calledOnceWithExactly(ModelExport.prototype.save, {
// 						...exportDocument,
// 						status: ModelExport.statuses.processed
// 					});

// 					sandbox.assert.calledOnceWithExactly(FakeModel.prototype.get, {
// 						filters: { legs: 4, isOld: true },
// 						order: {
// 							bornYear: 'desc'
// 						},
// 						page: 1,
// 						limit: 1
// 					});

// 					sandbox.assert.calledOnceWithExactly(EventEmitter.emit, {
// 						entity: 'export',
// 						event: 'processed',
// 						id: 'export-doc-1',
// 						client: 'defaultClient'
// 					});
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			},
// 			{
// 				description: 'Should return 200 when generate files and upload to S3',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.spy(FakeController.prototype, 'formatByPage');
// 					sandbox.spy(FakeController.prototype, 'formatByFile');

// 					const items = makeItems(5);
// 					const getModelStub = sandbox.stub(FakeModel.prototype, 'get');

// 					items.forEach((item, i) => {
// 						getModelStub.onCall(i).returns([item]);
// 					});

// 					sandbox.stub(FakeModel.prototype, 'getTotals').returns({
// 						pages: 5
// 					});

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 					sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
// 					sandbox.stub(S3, 'putObject');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.callCount(FakeModel.prototype.get, 5);
// 					sandbox.assert.calledOnce(FakeModel.prototype.getTotals);
// 					sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
// 					sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
// 					sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
// 					sandbox.assert.calledThrice(S3.putObject);
// 					sandbox.assert.calledOnce(ModelExport.prototype.save);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.postProcess);
// 					sandbox.assert.calledOnce(EventEmitter.emit);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			},
// 			{
// 				description: 'Should return 500 when fails generating files',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.spy(FakeController.prototype, 'formatByPage');
// 					sandbox.spy(FakeController.prototype, 'formatByFile');

// 					const items = makeItems(5);
// 					const getModelStub = sandbox.stub(FakeModel.prototype, 'get');

// 					items.forEach((item, i) => {
// 						getModelStub.onCall(i).returns([item]);
// 					});

// 					sandbox.stub(FakeModel.prototype, 'getTotals').returns({
// 						pages: 5
// 					});

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 					sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').rejects(new Error('Make Excel Fails'));
// 					sandbox.stub(S3, 'putObject');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.callCount(FakeModel.prototype.get, 5);
// 					sandbox.assert.calledOnce(FakeModel.prototype.getTotals);
// 					sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
// 					sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
// 					sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
// 					sandbox.assert.notCalled(S3.putObject);
// 					sandbox.assert.notCalled(ModelExport.prototype.save);
// 					sandbox.assert.notCalled(CreatedListener.prototype.postProcess);
// 					sandbox.assert.notCalled(EventEmitter.emit);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 500
// 			},
// 			{
// 				description: 'Should return 500 when fails uploading S3',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.spy(FakeController.prototype, 'formatByPage');
// 					sandbox.spy(FakeController.prototype, 'formatByFile');

// 					const items = makeItems(5);
// 					const getModelStub = sandbox.stub(FakeModel.prototype, 'get');

// 					items.forEach((item, i) => {
// 						getModelStub.onCall(i).returns([item]);
// 					});

// 					sandbox.stub(FakeModel.prototype, 'getTotals').returns({
// 						pages: 5
// 					});

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 					sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('excel'));
// 					sandbox.stub(S3, 'putObject').rejects(new Error('S3 fails'));
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.callCount(FakeModel.prototype.get, 5);
// 					sandbox.assert.calledOnce(FakeModel.prototype.getTotals);
// 					sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
// 					sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
// 					sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
// 					sandbox.assert.calledThrice(S3.putObject);
// 					sandbox.assert.notCalled(ModelExport.prototype.save);
// 					sandbox.assert.notCalled(CreatedListener.prototype.postProcess);
// 					sandbox.assert.notCalled(EventEmitter.emit);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 500
// 			}
// 		]);
// 	});

// 	context('When Controller has exclude fields', async () => {

// 		class FakeController extends ControllerExport {
// 			get pageLimit() {
// 				return 1;
// 			}

// 			get fileLimit() {
// 				return 2;
// 			}

// 			get excludeFields() {
// 				return ['id'];
// 			}

// 			format(items) {
// 				return items;
// 			}
// 		}

// 		before(() => {
// 			mockRequire(fakeModelPath, FakeModel);
// 			mockRequire(fakeControllerPath, FakeController);
// 			mockRequire(exportModelPath, ModelExport);
// 		});

// 		after(() => {
// 			mockRequire.stop(fakeModelPath);
// 			mockRequire.stop(fakeControllerPath);
// 			mockRequire.stop(exportModelPath);
// 		});

// 		let excludeFieldsSpy;
// 		let getExcelHeadersSpy;

// 		await EventListenerTest(handler, [
// 			{
// 				description: 'Should return 200 and exclude the field \'id\'',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.spy(FakeController.prototype, 'formatByPage');
// 					sandbox.spy(FakeController.prototype, 'formatByFile');
// 					getExcelHeadersSpy = sandbox.spy(FakeController.prototype, 'getExcelHeaders');
// 					excludeFieldsSpy = sandbox.spy(FakeController.prototype, 'excludeFields', ['get']);

// 					const items = makeItems(5);
// 					const getModelStub = sandbox.stub(FakeModel.prototype, 'get');

// 					items.forEach((item, i) => {
// 						getModelStub.onCall(i).returns([item]);
// 					});

// 					sandbox.stub(FakeModel.prototype, 'getTotals').returns({
// 						pages: 5
// 					});

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 					sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
// 					sandbox.stub(S3, 'putObject');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.callCount(FakeModel.prototype.get, 5);
// 					sandbox.assert.calledOnce(FakeModel.prototype.getTotals);
// 					sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
// 					sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
// 					assert(excludeFieldsSpy.get.called);
// 					assert(getExcelHeadersSpy.returned(['legs', 'bornYear', 'eyes', 'isOld']));
// 					sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
// 					sandbox.assert.calledThrice(S3.putObject);
// 					sandbox.assert.calledOnce(ModelExport.prototype.save);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.postProcess);
// 					sandbox.assert.calledOnce(EventEmitter.emit);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			}
// 		]);
// 	});

// 	context('When Controller has include fields', async () => {

// 		class FakeController extends ControllerExport {
// 			get pageLimit() {
// 				return 1;
// 			}

// 			get fileLimit() {
// 				return 2;
// 			}

// 			get fields() {
// 				return ['bornYear'];
// 			}

// 			get excludeFields() {
// 				return ['id'];
// 			}
// 		}

// 		before(() => {
// 			mockRequire(fakeModelPath, FakeModel);
// 			mockRequire(fakeControllerPath, FakeController);
// 			mockRequire(exportModelPath, ModelExport);
// 		});

// 		after(() => {
// 			mockRequire.stop(fakeModelPath);
// 			mockRequire.stop(fakeControllerPath);
// 			mockRequire.stop(exportModelPath);
// 		});

// 		let excludeFieldsSpy;
// 		let getExcelHeadersSpy;

// 		await EventListenerTest(handler, [
// 			{
// 				description: 'Should return 200 used include only \'bornYear\' field and not use exclude Files',
// 				session: true,
// 				before: sandbox => {
// 					sandbox.stub(ModelExport.prototype, 'update').returns(true);
// 					sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
// 					sandbox.spy(CreatedListener.prototype, 'preProcess');
// 					sandbox.spy(CreatedListener.prototype, 'postProcess');

// 					sandbox.spy(FakeController.prototype, 'formatByPage');
// 					sandbox.spy(FakeController.prototype, 'formatByFile');
// 					getExcelHeadersSpy = sandbox.spy(FakeController.prototype, 'getExcelHeaders');
// 					excludeFieldsSpy = sandbox.spy(FakeController.prototype, 'excludeFields', ['get']);

// 					const items = makeItems(5);
// 					const getModelStub = sandbox.stub(FakeModel.prototype, 'get');

// 					items.forEach((item, i) => {
// 						getModelStub.onCall(i).returns([item]);
// 					});

// 					sandbox.stub(FakeModel.prototype, 'getTotals').returns({
// 						pages: 5
// 					});

// 					sandbox.stub(ModelExport.prototype, 'save').returns('export-id-1');
// 					sandbox.stub(EventEmitter, 'emit');
// 					sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
// 					sandbox.stub(S3, 'putObject');
// 				},
// 				after: sandbox => {
// 					sandbox.assert.calledOnce(ModelExport.prototype.update);
// 					sandbox.assert.calledOnce(ModelExport.prototype.get);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.preProcess);
// 					sandbox.assert.callCount(FakeModel.prototype.get, 5);
// 					sandbox.assert.calledOnce(FakeModel.prototype.getTotals);
// 					sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
// 					sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
// 					assert(excludeFieldsSpy.get.notCalled);
// 					assert(getExcelHeadersSpy.returned(['bornYear']));
// 					sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
// 					sandbox.assert.calledThrice(S3.putObject);
// 					sandbox.assert.calledOnce(ModelExport.prototype.save);
// 					sandbox.assert.calledOnce(CreatedListener.prototype.postProcess);
// 					sandbox.assert.calledOnce(EventEmitter.emit);
// 				},
// 				event: { ...validEvent },
// 				responseCode: 200
// 			}
// 		]);
// 	});
// });
