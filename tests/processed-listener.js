'use strict';

const { Mail, MailError } = require('@janiscommerce/mail');
const S3 = require('@janiscommerce/s3');
const mockRequire = require('mock-require');
const path = require('path');
const logger = require('lllog');

logger('none');

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const EventListenerTest = require('@janiscommerce/event-listener-test');

const { ProcessedListener, ModelExport, ControllerExport } = require('../lib/index');

const handler = (...args) => ServerlessHandler.handle(ProcessedListener, ...args);

describe('Processed Export Listener', async () => {

	const validEvent = {
		service: 'some-service',
		client: 'defaultClient',
		entity: 'export',
		event: 'processed',
		id: 'export-doc-1'
	};

	const exportDocument = {
		id: validEvent.id,
		entity: 'cat',
		userCreated: 'terrier-1',
		userEmail: 'dogs@revenge.com',
		files: [
			'exports/defaultClient/terrier-1/cats-001.xlsx',
			'exports/defaultClient/terrier-1/cats-002.xlsx'
		]
	};

	const fakeControllerPath = path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', 'cat');
	const exportModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'export');

	class FakeController extends ControllerExport {}

	before(() => {
		mockRequire(fakeControllerPath, FakeController);
		mockRequire(exportModelPath, ModelExport);
	});

	after(() => {
		mockRequire.stop(fakeControllerPath);
		mockRequire.stop(exportModelPath);
	});


	await EventListenerTest(handler, [
		{
			description: 'Should return 400 if the event has no client',
			session: true,
			event: {
				...validEvent,
				client: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 400 if the event has no ID',
			session: true,
			event: {
				...validEvent,
				id: undefined
			},
			responseCode: 400
		},
		{
			description: 'Should return 200 if the export document cannot be found',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'get').returns([]);
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledWithExactly(ModelExport.prototype.get, { filters: { id: validEvent.id } });
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if the export Document has no files',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'get').returns([{ id: validEvent.id }]);
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if Mail is send succesfully',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntityId').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'send');

				const s3Stub = sandbox.stub(S3, 'getSignedUrl');
				s3Stub.onCall(0).returns('https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-001.xlsx');
				s3Stub.onCall(1).returns('https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-002.xlsx');
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setEntityId);
				sandbox.assert.calledOnce(Mail.prototype.setEntity);
				sandbox.assert.calledOnce(Mail.prototype.setData);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);

				sandbox.assert.calledWithExactly(Mail.prototype.setEntity, 'export');
				sandbox.assert.calledWithExactly(Mail.prototype.setEntityId, exportDocument.id);
				sandbox.assert.calledWithExactly(Mail.prototype.setData, {
					entity: exportDocument.entity,
					userEmail: exportDocument.userEmail,
					files: ['https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-001.xlsx',
						'https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-002.xlsx']
				});
				sandbox.assert.calledWithExactly(Mail.prototype.setTemplateCode, 'export');
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if Mail fail',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntityId').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'send').rejects(new Error('Mails Failed'));
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setEntityId);
				sandbox.assert.calledOnce(Mail.prototype.setEntity);
				sandbox.assert.calledOnce(Mail.prototype.setData);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 500 if Mail fail when Microservice Call',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntityId').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);

				const MsCallError = new Error('Mails Failed');
				MsCallError.code = MailError.codes.MS_CALL_ERROR;

				sandbox.stub(Mail.prototype, 'send').rejects(MsCallError);
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setEntityId);
				sandbox.assert.calledOnce(Mail.prototype.setEntity);
				sandbox.assert.calledOnce(Mail.prototype.setData);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);
			},
			event: { ...validEvent },
			responseCode: 500
		}
	]);
});
