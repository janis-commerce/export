'use strict';

const exportFormatter = (document, userCreated, userEmail, status) => {

	if(document.sortBy && !document.sortDirection)
		document.sortDirection = 'asc';

	return {
		...document,
		userCreated,
		userEmail,
		status
	};
};

module.exports = {
	exportFormatter
};
