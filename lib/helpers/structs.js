'use strict';

const { struct } = require('@janiscommerce/superstruct');

const filterStruct = struct('string | number | array | boolean | object');

const exportStruct = struct.partial({
	entity: 'string',
	filters: struct.optional(struct.dict(['string', filterStruct])),
	sortBy: 'string?',
	sortDirection: 'string?'
});

const sortDirectionsStruct = struct.enum(['asc', 'desc', 'ASC', 'DESC']);

module.exports = {
	exportStruct,
	sortDirectionsStruct
};
