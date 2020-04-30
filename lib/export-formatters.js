'use strict';

class ExportFormatters {

	/**
	 * Format a user into a single string
	 *
	 * @param {Object} user
	 * @returns {string|null}
	 */
	static formatUser(user) {

		if(!user)
			return null;

		const firstname = user.firstname || '-';
		const lastname = user.lastname || '-';
		const email = user.email || '-';
		return `${firstname} ${lastname} (${email})`;
	}

	/**
	 * It formats a date into locale.
	 *
	 * @param {string} dateToFormat
	 * @returns {string|null}
	 */
	static formatDate(dateToFormat) {

		if(!dateToFormat)
			return null;

		const date = new Date(dateToFormat);

		return date.toLocaleString();
	}

}

module.exports = ExportFormatters;
