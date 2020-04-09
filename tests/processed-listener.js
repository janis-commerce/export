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
				sandbox.stub(ModelExport.prototype, 'update').returns(true);
				sandbox.stub(ModelExport.prototype, 'get').returns([]);
			},
			after: sandbox => {
				sandbox.assert.calledOnceWithExactly(ModelExport.prototype.update,
					{ status: ModelExport.statuses.sending },
					{ id: validEvent.id, status: ModelExport.statuses.processed }
				);
				sandbox.assert.calledOnceWithExactly(ModelExport.prototype.get, { filters: { id: validEvent.id, status: ModelExport.statuses.sending } });
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if can\'t update the export document status',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'update').returns(false);
				sandbox.stub(ModelExport.prototype, 'get');
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.update);
				sandbox.assert.notCalled(ModelExport.prototype.get);
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if the export Document has no files',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'update').returns(true);
				sandbox.stub(ModelExport.prototype, 'get').returns([{ id: validEvent.id }]);
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.update);
				sandbox.assert.calledOnce(ModelExport.prototype.get);
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 200 if Mail is send succesfully',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'update').returns(true);
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returnsThis();
				sandbox.stub(Mail.prototype, 'setEntityId').returnsThis();
				sandbox.stub(Mail.prototype, 'setData').returnsThis();
				sandbox.stub(Mail.prototype, 'setTemplateCode').returnsThis();
				sandbox.stub(Mail.prototype, 'send');

				const s3Stub = sandbox.stub(S3, 'getSignedUrl');
				s3Stub.onCall(0).returns('https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-001.xlsx');
				s3Stub.onCall(1).returns('https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-002.xlsx');
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);

				sandbox.assert.calledTwice(ModelExport.prototype.update);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(0),
					{ status: ModelExport.statuses.sending },
					{ id: validEvent.id, status: ModelExport.statuses.processed }
				);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(1),
					{ status: ModelExport.statuses.sent },
					{ id: validEvent.id, status: ModelExport.statuses.sending }
				);

				sandbox.assert.calledOnceWithExactly(Mail.prototype.setEntity, 'export');
				sandbox.assert.calledOnceWithExactly(Mail.prototype.setEntityId, exportDocument.id);
				sandbox.assert.calledOnceWithExactly(Mail.prototype.setData, {
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
				sandbox.stub(ModelExport.prototype, 'update').returns(true);
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returnsThis();
				sandbox.stub(Mail.prototype, 'setEntityId').returnsThis();
				sandbox.stub(Mail.prototype, 'setData').returnsThis();
				sandbox.stub(Mail.prototype, 'setTemplateCode').returnsThis();
				sandbox.stub(Mail.prototype, 'send').rejects(new Error('Mails Failed'));

				sandbox.stub(S3, 'getSignedUrl');
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setEntityId);
				sandbox.assert.calledOnce(Mail.prototype.setEntity);
				sandbox.assert.calledOnce(Mail.prototype.setData);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);

				sandbox.assert.calledTwice(ModelExport.prototype.update);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(0),
					{ status: ModelExport.statuses.sending },
					{ id: validEvent.id, status: ModelExport.statuses.processed }
				);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(1),
					{ status: ModelExport.statuses.sendingError },
					{ id: validEvent.id, status: ModelExport.statuses.sending }
				);
			},
			event: { ...validEvent },
			responseCode: 200
		},
		{
			description: 'Should return 500 if Mail fail when Microservice Call',
			session: true,
			before: sandbox => {
				sandbox.stub(ModelExport.prototype, 'update').returns(true);
				sandbox.stub(ModelExport.prototype, 'get').returns([exportDocument]);
				sandbox.stub(Mail.prototype, 'setEntity').returnsThis();
				sandbox.stub(Mail.prototype, 'setEntityId').returnsThis();
				sandbox.stub(Mail.prototype, 'setData').returnsThis();
				sandbox.stub(Mail.prototype, 'setTemplateCode').returnsThis();

				sandbox.stub(S3, 'getSignedUrl');

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

				sandbox.assert.calledTwice(ModelExport.prototype.update);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(0),
					{ status: ModelExport.statuses.sending },
					{ id: validEvent.id, status: ModelExport.statuses.processed }
				);
				sandbox.assert.calledWithExactly(ModelExport.prototype.update.getCall(1),
					{ status: ModelExport.statuses.sendingError },
					{ id: validEvent.id, status: ModelExport.statuses.sending }
				);
			},
			event: { ...validEvent },
			responseCode: 500
		}
	]);
});
