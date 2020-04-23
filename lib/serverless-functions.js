'use strict';

module.exports = serviceName => [
	['janis.apiPost', {
		entityName: 'export',
		authorizer: 'ImportExportAuthorizer',
		cors: true,
		timeout: 10,
		package: { include: ['src/models/**', 'src/controllers/export/**'] }
	}],

	['janis.eventListener', {
		serviceName,
		entityName: 'export',
		eventName: 'created',
		mustHaveClient: true,
		mustHaveId: true,
		package: { include: ['src/models/**', 'src/controllers/export/**'] }
	}],

	['janis.eventListener', {
		serviceName,
		entityName: 'export',
		eventName: 'processed',
		mustHaveClient: true,
		mustHaveId: true,
		package: { include: ['src/models/**', 'src/controllers/export/**'] }
	}]
];
