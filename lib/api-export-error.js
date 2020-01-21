'use strict';

class ApiExportError extends Error {

	static get codes() {

		return {
			INVALID_MODEL: 1,
			INVALID_CONTROLLER: 2,
			INVALID_USER: 3,
			MS_CALL_ERROR: 4,
			INTERNAL_ERROR: 99
		};

	}

	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiExportError';

		if(err instanceof Error)
			this.previousError = err;
	}
}

module.exports = ApiExportError;
