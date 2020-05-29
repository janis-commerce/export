'use strict';

const path = require('path');

module.exports = serviceName => {

	const handlerPath = path.join(process.env.MS_PATH || '', 'lambda', 'ExportProcess', 'index.handler');
	const controllersPath = path.join(process.env.MS_PATH || '', 'controllers', 'export', '**');
	const modelsPath = path.join(process.env.MS_PATH || '', 'models', '**');
	const resourceAux = '${self:custom.stage}';// eslint-disable-line

	return [
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
				resource: `arn:aws:s3:::janis-${serviceName}-service-${resourceAux}/*`// eslint-disable-line
			}
		]
	];
};
