'use strict';

const Mail = require('@janiscommerce/mail');
const logger = require('lllog');

logger('none');

const EventListenerTest = require('@janiscommerce/event-listener-test');

const { ProcessedListener, ModelExport } = require('../lib/index');

describe('Account Saved Listener', async () => {

	const validEvent = {
		service: 'some-service',
		client: 'defaultClient',
		entity: 'export',
		event: 'processed',
		id: 'export-doc-1'
	};

	const exportDocument = {
		id: validEvent.id,
		entity: 'cats',
		userCreated: 'terrier-1',
		userEmail: 'dogs@revenge.com',
		files: [
			'https://janis-some-service-test/exports/defaultClient/terrier-1/cats-001.xlsx',
			'https://janis-some-service-test/exports/defaultClient/terrier-1/cats-002.xlsx'
		]
	};

	await EventListenerTest(ProcessedListener.handler, [
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
				sandbox.stub(Mail.prototype, 'setTo').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setSubject').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'send');
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setTo);
				sandbox.assert.calledOnce(Mail.prototype.setSubject);
				sandbox.assert.calledOnce(Mail.prototype.setEntity);
				sandbox.assert.calledOnce(Mail.prototype.setData);
				sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);
				sandbox.assert.calledOnce(Mail.prototype.send);

				sandbox.assert.calledWithExactly(Mail.prototype.setTo, exportDocument.userEmail);
				sandbox.assert.calledWithExactly(Mail.prototype.setSubject, `${exportDocument.entity} Export Files`);
				sandbox.assert.calledWithExactly(Mail.prototype.setEntity, exportDocument.entity);
				sandbox.assert.calledWithExactly(Mail.prototype.setData, exportDocument.files);
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
				sandbox.stub(Mail.prototype, 'setTo').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setSubject').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'send').rejects(new Error('Mails Failed'));
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setTo);
				sandbox.assert.calledOnce(Mail.prototype.setSubject);
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
				sandbox.stub(Mail.prototype, 'setTo').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setSubject').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setEntity').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setData').returns(Mail.prototype);
				sandbox.stub(Mail.prototype, 'setTemplateCode').returns(Mail.prototype);

				const MsCallError = new Error('Mails Failed');
				MsCallError.code = 4;

				sandbox.stub(Mail.prototype, 'send').rejects(MsCallError);
			},
			after: sandbox => {
				sandbox.assert.calledOnce(ModelExport.prototype.get);
				sandbox.assert.calledOnce(Mail.prototype.setTo);
				sandbox.assert.calledOnce(Mail.prototype.setSubject);
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
