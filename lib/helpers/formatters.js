'use strict';

const exportFormatter = (document, userCreated, userEmail) => {

	if(document.sortBy && !document.sortDirection)
		document.sortDirection = 'asc';

	return {
		...document,
		userCreated,
		userEmail
	};
};

module.exports = {
	exportFormatter
};
