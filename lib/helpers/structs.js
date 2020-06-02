'use strict';

const { struct } = require('@janiscommerce/superstruct');
const model = require('../model-export');

const filterStruct = struct('string | number | array | boolean | object');


const exportApiStruct = struct.partial({
	entity: 'string',
	filters: struct.optional(struct.dict(['string', filterStruct])),
	sortBy: 'string?',
	sortDirection: 'string?'
});

const sortDirectionsStruct = struct.enum(['asc', 'desc', 'ASC', 'DESC']);

const exportDocumentStruct = struct.partial({
	id: 'string',
	filters: 'object?',
	entity: 'string',
	sortDirection: sortDirectionsStruct,
	sortBy: 'string?',
	userEmail: 'email',
	userCreated: 'objectId',
	status: struct.enum(Object.values(model.statuses))
});

const exportProcessStruct = struct({
	exportDocument: exportDocumentStruct
});

module.exports = {
	exportApiStruct,
	sortDirectionsStruct,
	exportProcessStruct
};
