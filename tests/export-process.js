'use strict';

const sandbox = require('sinon').createSandbox();
const assert = require('assert');

const mockRequire = require('mock-require');
const path = require('path');

const { Handler } = require('@janiscommerce/lambda');
const Model = require('@janiscommerce/model');


const S3 = require('@janiscommerce/s3');
const ExcelJS = require('exceljs');
const { Mail } = require('@janiscommerce/mail');
const { ModelExport, ControllerExport } = require('../lib');

require('lllog')('none');
const ExportProcess = require('../lib/export-process');

const exportProcessHandler = (...args) => Handler.handle(ExportProcess, ...args);

describe('Export Process Test', async () => {

	const exportDocument = {
		id: '5e0a0619bcc3ce0007a18011',
		entity: 'cat',
		filters: { legs: 4, isOld: 1 },
		sortBy: 'bornYear',
		sortDirection: 'desc',
		userCreated: '5e0a0619bcc3ce0007a18123',
		userEmail: 'dogs@revenge.com'
	};

	const event = {
		__clientCode: 'defaultClient',
		body: { exportDocument }
	};

	const makeItems = quantity => Array(quantity).fill()
		.map((item, index) => ({
			id: index,
			legs: 4,
			bornYear: 2019,
			eyes: 2,
			isOld: true
		}));


	class FakeModel extends Model {}

	const fakeModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'cat');
	const fakeControllerPath = path.join(process.cwd(), process.env.MS_PATH || '', 'controllers', 'export', 'cat');
	const exportModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'export');

	const beforeMockRequire = ControllerToMock => {
		mockRequire(fakeModelPath, FakeModel);
		mockRequire(fakeControllerPath, ControllerToMock);
		mockRequire(exportModelPath, ModelExport);
	};

	const afterMockRequire = () => {
		mockRequire.stop(fakeModelPath);
		mockRequire.stop(fakeControllerPath);
		mockRequire.stop(exportModelPath);
	};


	const stubModelWith5Elelements = () => {

		const items = makeItems(5);
		const getModelStub = sandbox.stub(FakeModel.prototype, 'get');
		items.forEach((item, i) => {
			getModelStub.onCall(i).returns([item]);
		});
		sandbox.stub(FakeModel.prototype, 'getTotals').returns({
			pages: 5
		});
	};

	const commonStubs = FakeController => {
		sandbox.spy(ExportProcess.prototype, 'preProcess');
		sandbox.spy(ExportProcess.prototype, 'postProcess');
		sandbox.stub(ModelExport.prototype, 'save').returns(true);
		sandbox.stub(ModelExport.prototype, 'update').returns(true);
		sandbox.spy(FakeController.prototype, 'formatByPage');
		sandbox.spy(FakeController.prototype, 'formatByFile');
	};

	const commonAsserts = FakeController => {
		sandbox.assert.calledOnce(ExportProcess.prototype.preProcess);
		sandbox.assert.callCount(FakeModel.prototype.get, 5);
		sandbox.assert.callCount(FakeController.prototype.formatByPage, 5);
		sandbox.assert.calledThrice(FakeController.prototype.formatByFile);
	};

	class FakeController extends ControllerExport {
		get pageLimit() {
			return 1;
		}

		get fileLimit() {
			return 2;
		}

		format(items) {
			return items;
		}
	}

	const files =
			['exports/defaultClient/5e0a0619bcc3ce0007a18123/cat-5e0a0619bcc3ce0007a18011-part1.xlsx',
				'exports/defaultClient/5e0a0619bcc3ce0007a18123/cat-5e0a0619bcc3ce0007a18011-part2.xlsx',
				'exports/defaultClient/5e0a0619bcc3ce0007a18123/cat-5e0a0619bcc3ce0007a18011-part3.xlsx'];


	context('When Controller has no include fields or exclude', async () => {

		class FakeControllerFormatFilters extends FakeController {

			formatFilters(filters) {
				const forceBoolean = value => !(value === 'false' || value === '0' || !value);

				if(filters.isOld) {
					return {
						...filters,
						isOld: forceBoolean(filters.isOld)
					};
				}

				return filters;
			}
		}

		afterEach(() => sandbox.restore());

		before(() => {
			beforeMockRequire(FakeControllerFormatFilters);
		});

		after(() => {
			afterMockRequire();
		});

		it('Should not call process when client is not passed', async () => {

			sandbox.stub(ExportProcess.prototype, 'process').returns(true);

			await exportProcessHandler({
				...event,
				__clientCode: undefined
			});

			sandbox.assert.notCalled(ExportProcess.prototype.process);
		});

		it('Should not call process when payload is not passed', async () => {

			sandbox.stub(ExportProcess.prototype, 'process').returns(true);

			await exportProcessHandler({
				...event,
				body: undefined
			});

			sandbox.assert.notCalled(ExportProcess.prototype.process);
		});

		context('When fields are wrong', async () => {

			const makeWrongInput = field => {

				const data = { ...exportDocument };
				data[field] = [123];
				return data;
			};

			const samples = Object.keys(exportDocument);

			samples.forEach(async field => {

				it(`Should not call process when ${field} is wrong`, async () => {

					sandbox.stub(ExportProcess.prototype, 'process').returns(true);

					await exportProcessHandler(makeWrongInput(field));

					sandbox.assert.notCalled(ExportProcess.prototype.process);
				});
			});
		});


		it('Should\'t generateAndUploadFiles if pre process throws an error', async () => {

			sandbox.stub(ExportProcess.prototype, 'preProcess').rejects(new Error('Some Error'));
			sandbox.stub(ControllerExport.prototype, 'generateAndUploadFiles').returns(true);

			await assert.rejects(exportProcessHandler(event), { message: 'Some Error' });

			sandbox.assert.calledOnceWithExactly(ExportProcess.prototype.preProcess, exportDocument);
			sandbox.assert.notCalled(ControllerExport.prototype.generateAndUploadFiles);
		});


		it('Should throw if it can\'t save the new export document\'s status with the files', async () => {

			sandbox.spy(ExportProcess.prototype, 'preProcess');
			sandbox.spy(ExportProcess.prototype, 'postProcess');
			sandbox.stub(FakeModel.prototype, 'get').returns([]);
			sandbox.stub(ModelExport.prototype, 'save').rejects(new Error('Some DB error'));

			await assert.rejects(exportProcessHandler(event), { message: 'Some DB error' });

			sandbox.assert.calledOnce(ExportProcess.prototype.preProcess);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			sandbox.assert.calledOnceWithExactly(ModelExport.prototype.save,
				{
					...exportDocument,
					files: [],
					status: ModelExport.statuses.processed
				});

			sandbox.assert.calledOnceWithExactly(FakeModel.prototype.get, {
				filters: { legs: 4, isOld: true },
				order: {
					bornYear: 'desc'
				},
				page: 1,
				limit: 1
			});
		});

		it('Should save the status even if there are no files to export', async () => {

			commonStubs(FakeControllerFormatFilters);
			sandbox.stub(FakeModel.prototype, 'get').returns([]);
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			await (exportProcessHandler(event));

			sandbox.assert.calledOnce(ExportProcess.prototype.preProcess);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			sandbox.assert.calledOnce(FakeControllerFormatFilters.prototype.formatByPage);
			sandbox.assert.notCalled(FakeControllerFormatFilters.prototype.formatByFile);

			sandbox.assert.calledOnceWithExactly(ModelExport.prototype.save,
				{
					...exportDocument,
					files: [],
					status: ModelExport.statuses.processed
				});

			sandbox.assert.calledOnceWithExactly(FakeModel.prototype.get, {
				filters: { legs: 4, isOld: true },
				order: {
					bornYear: 'desc'
				},
				page: 1,
				limit: 1
			});

			sandbox.assert.calledOnceWithExactly(ExportProcess.prototype.sendEmail, { ...exportDocument, files: [] });

			sandbox.assert.calledOnceWithExactly(ModelExport.prototype.update, {
				status: ModelExport.statuses.sent
			}, {
				id: exportDocument.id,
				status: ModelExport.statuses.processed
			});
		});

		it('Should generate files and upload them to S3 when export document is correct', async () => {

			commonStubs(FakeControllerFormatFilters);
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			stubModelWith5Elelements();

			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject');

			await exportProcessHandler(event);

			sandbox.assert.calledOnce(ModelExport.prototype.save);
			commonAsserts(FakeControllerFormatFilters);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			sandbox.assert.calledOnceWithExactly(ExportProcess.prototype.sendEmail, { ...exportDocument, files });
			sandbox.assert.calledOnce(ModelExport.prototype.update);
		});

		it('Should thrown an error when it fails generating the files', async () => {

			commonStubs(FakeControllerFormatFilters);
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			stubModelWith5Elelements();

			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').rejects(new Error('Make Excel Fails'));
			sandbox.stub(S3, 'putObject');

			await assert.rejects(exportProcessHandler(event), { message: 'Make Excel Fails' });

			sandbox.assert.notCalled(ModelExport.prototype.save);
			commonAsserts(FakeControllerFormatFilters);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.notCalled(S3.putObject);
			sandbox.assert.notCalled(ExportProcess.prototype.postProcess);
			sandbox.assert.notCalled(ExportProcess.prototype.sendEmail);
			sandbox.assert.notCalled(ModelExport.prototype.update);
		});

		it('Should throw an error when it fails uploading the files', async () => {

			commonStubs(FakeControllerFormatFilters);
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			stubModelWith5Elelements();

			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject').rejects(new Error('S3 fails'));

			await assert.rejects(exportProcessHandler(event), { message: 'S3 fails' });

			sandbox.assert.notCalled(ModelExport.prototype.save);
			commonAsserts(FakeControllerFormatFilters);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);
			sandbox.assert.notCalled(ExportProcess.prototype.postProcess);
			sandbox.assert.notCalled(ExportProcess.prototype.sendEmail);
			sandbox.assert.notCalled(ModelExport.prototype.update);
		});
	});

	context('When Controller has exclude fields', async () => {

		class FakeControllerExcludesFields extends FakeController {

			get excludeFields() {
				return ['id'];
			}
		}

		afterEach(() => sandbox.restore());

		before(() => {
			beforeMockRequire(FakeControllerExcludesFields);
		});

		after(() => {
			afterMockRequire();
		});

		let excludeFieldsSpy;
		let getExcelHeadersSpy;

		it('Should generate the files, upload them and mail the files', async () => {

			commonStubs(FakeControllerExcludesFields);
			stubModelWith5Elelements();

			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject');
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			getExcelHeadersSpy = sandbox.spy(FakeControllerExcludesFields.prototype, 'getExcelHeaders');
			excludeFieldsSpy = sandbox.spy(FakeControllerExcludesFields.prototype, 'excludeFields', ['get']);

			await exportProcessHandler(event);

			sandbox.assert.calledOnce(ModelExport.prototype.save);
			commonAsserts(FakeControllerExcludesFields);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);

			sandbox.assert.calledOnceWithExactly(ExportProcess.prototype.sendEmail, { ...exportDocument, files });

			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			assert(excludeFieldsSpy.get.called);
			assert(getExcelHeadersSpy.returned(['legs', 'bornYear', 'eyes', 'isOld']));
			sandbox.assert.calledOnce(ModelExport.prototype.update);
		});

	});

	context('When Controller has include fields', async () => {

		class FakeControllerIncludesFields extends ControllerExport {
			get pageLimit() {
				return 1;
			}

			get fileLimit() {
				return 2;
			}

			get fields() {
				return ['bornYear'];
			}

			get excludeFields() {
				return ['id'];
			}
		}

		afterEach(() => sandbox.restore());

		before(() => {
			beforeMockRequire(FakeControllerIncludesFields);
		});

		after(() => {
			afterMockRequire();
		});

		let excludeFieldsSpy;
		let getExcelHeadersSpy;

		it('Should generate the files, upload them and mail the files', async () => {

			commonStubs(FakeControllerIncludesFields);

			stubModelWith5Elelements();
			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject');
			sandbox.stub(ExportProcess.prototype, 'sendEmail').returns(true);

			getExcelHeadersSpy = sandbox.spy(FakeControllerIncludesFields.prototype, 'getExcelHeaders');
			excludeFieldsSpy = sandbox.spy(FakeControllerIncludesFields.prototype, 'excludeFields', ['get']);

			await exportProcessHandler(event);

			commonAsserts(FakeControllerIncludesFields);

			sandbox.assert.calledOnce(ModelExport.prototype.update);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);
			sandbox.assert.calledOnceWithExactly(ExportProcess.prototype.sendEmail, { ...exportDocument, files });
			sandbox.assert.calledOnce(ModelExport.prototype.save);
			assert(excludeFieldsSpy.get.notCalled);
			assert(getExcelHeadersSpy.returned(['bornYear']));
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
		});

	});

	context('When mailing files', async () => {

		class FakeControllerFormatFilters extends FakeController {

			formatFilters(filters) {
				const forceBoolean = value => !(value === 'false' || value === '0' || !value);

				if(filters.isOld) {
					return {
						...filters,
						isOld: forceBoolean(filters.isOld)
					};
				}

				return filters;
			}
		}

		afterEach(() => sandbox.restore());

		before(() => {
			beforeMockRequire(FakeControllerFormatFilters);
		});

		after(() => {
			afterMockRequire();
		});

		const filesSigned = [
			'https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-001.xlsx',
			'https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-002.xlsx',
			'https://janis-some-service-test.s3.amazonaws.com/exports/defaultClient/terrier-1/cats-export-doc-1-003.xlsx'];


		it('Should send an email succesfully', async () => {

			commonStubs(FakeControllerFormatFilters);
			stubModelWith5Elelements();
			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject');
			sandbox.stub(Mail.prototype, 'setEntity').returnsThis();
			sandbox.stub(Mail.prototype, 'setEntityId').returnsThis();
			sandbox.stub(Mail.prototype, 'setData').returnsThis();
			sandbox.stub(Mail.prototype, 'setTemplateCode').returnsThis();
			sandbox.stub(Mail.prototype, 'send');
			const s3Stub = sandbox.stub(S3, 'getSignedUrl');
			s3Stub.onCall(0).returns(filesSigned[0]);
			s3Stub.onCall(1).returns(filesSigned[1]);
			s3Stub.onCall(2).returns(filesSigned[2]);

			await exportProcessHandler(event);

			sandbox.assert.calledOnce(ModelExport.prototype.save);
			commonAsserts(FakeControllerFormatFilters);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);

			sandbox.assert.calledOnceWithExactly(ModelExport.prototype.update,
				{ status: ModelExport.statuses.sent },
				{ id: exportDocument.id, status: ModelExport.statuses.processed });
			sandbox.assert.calledOnceWithExactly(Mail.prototype.setEntity, 'export');
			sandbox.assert.calledOnceWithExactly(Mail.prototype.setEntityId, exportDocument.id);

			sandbox.assert.calledOnceWithExactly(Mail.prototype.setData, {
				entity: exportDocument.entity,
				userEmail: exportDocument.userEmail,
				files: filesSigned
			});
			sandbox.assert.calledWithExactly(Mail.prototype.setTemplateCode, 'export');
		});

		it('Should not fail if the export document has no files', async () => {

			commonStubs(FakeControllerFormatFilters);
			sandbox.stub(FakeModel.prototype, 'get').returns([]);

			await (exportProcessHandler(event));

			sandbox.assert.calledOnce(ExportProcess.prototype.preProcess);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			sandbox.assert.calledOnce(FakeControllerFormatFilters.prototype.formatByPage);
			sandbox.assert.notCalled(FakeControllerFormatFilters.prototype.formatByFile);
			sandbox.assert.calledOnce(ModelExport.prototype.save);
			sandbox.assert.calledOnce(FakeModel.prototype.get);
			sandbox.assert.calledOnce(ModelExport.prototype.update);
		});

		it('Should not throw an error if Mail fails', async () => {


			commonStubs(FakeControllerFormatFilters);
			stubModelWith5Elelements();
			sandbox.stub(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').returns(Buffer.from('some-excel-file'));
			sandbox.stub(S3, 'putObject');
			sandbox.stub(Mail.prototype, 'setEntity').returnsThis();
			sandbox.stub(Mail.prototype, 'setEntityId').returnsThis();
			sandbox.stub(Mail.prototype, 'setData').returnsThis();
			sandbox.stub(Mail.prototype, 'setTemplateCode').returnsThis();
			sandbox.stub(Mail.prototype, 'send').rejects(new Error('Mails Failed'));
			sandbox.stub(S3, 'getSignedUrl');

			await exportProcessHandler(event);

			sandbox.assert.calledTwice(ModelExport.prototype.save);
			commonAsserts(FakeControllerFormatFilters);
			sandbox.assert.calledThrice(ExcelJS.Workbook.prototype.xlsx.writeBuffer);
			sandbox.assert.calledThrice(S3.putObject);
			sandbox.assert.calledOnce(ExportProcess.prototype.postProcess);
			sandbox.assert.calledOnce(Mail.prototype.setEntity);
			sandbox.assert.calledOnce(Mail.prototype.setEntityId);
			sandbox.assert.calledOnce(Mail.prototype.setData);
			sandbox.assert.calledOnce(Mail.prototype.setTemplateCode);

			sandbox.assert.calledWithExactly(ModelExport.prototype.save.getCall(1),
				{
					...exportDocument,
					files,
					status: ModelExport.statuses.sendingError,
					error: 'Mails Failed'
				});
		});
	});
});
