'use strict';

const assert = require('assert');
const path = require('path');
const { exportServerless } = require('../lib/index');

const handlerPathWithSrc = path.join('src', 'lambda', 'ExportProcess', 'index.handler');
const controllersPathWithSrc = path.join('src', 'controllers', 'export', '**');
const modelsPathWithSrc = path.join('src', 'models', '**');

const handlerPathWithoutSrc = path.join('lambda', 'ExportProcess', 'index.handler');
const controllersPathWithoutSrc = path.join('controllers', 'export', '**');
const modelsPathWithoutSrc = path.join('models', '**');

const resourceAux = '${self:custom.stage}';// eslint-disable-line

const getHooks = (handlerPath, modelsPath, controllersPath) => [
	[
		'janis.apiPost', {
			entityName: 'export',
			authorizer: 'ImportExportAuthorizer',
			cors: true,
			timeout: 10,
			package: { include: [modelsPath, controllersPath] }
		}
	],

	[
		'function', {
			functionName: 'ExportProcess',
			handler: handlerPath,
			description: 'Export Process Lambda',
			timeout: 60,
			package: { include: [modelsPath, controllersPath] }
		}
	],

	[
		'iamStatement', {
			action: [
				's3:PutObject',
				's3:GetObject'
			],
			resource: `arn:aws:s3:::janis-wms-service-${resourceAux}/*`// eslint-disable-line
		}
	]
];


describe('export-serveless', () => {

	describe('Export Serverless', () => {

		it('Should return the correct hooks with MS_PATH ', () => {
			process.env.MS_PATH = 'src';
			assert.deepStrictEqual(exportServerless('wms'),
				getHooks(handlerPathWithSrc, modelsPathWithSrc, controllersPathWithSrc));
		});

		it('Should return the correct hooks without MS_PATH', () => {
			delete (process.env.MS_PATH);
			assert.deepStrictEqual(exportServerless('wms'),
				getHooks(handlerPathWithoutSrc, modelsPathWithoutSrc, controllersPathWithoutSrc));
		});
	});
});
