'use strict';

const { struct } = require('superstruct');

const exportStruct = struct.partial({
	entity: 'string',
	filters: 'object?',
	sortBy: 'string?',
	sortDirection: 'string?'
});

const filterStruct = struct('string | number | array');

const sortDirectionsStruct = struct.enum(['asc', 'desc', 'ASC', 'DESC']);

module.exports = {
	exportStruct,
	filterStruct,
	sortDirectionsStruct
};
