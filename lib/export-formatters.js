'use strict';

class ExportFormatters {

	/**
	 * Format a user into a single string
	 *
	 * @param {Object} user
	 * @returns {string|null}
	 * @memberof ExportFormatters
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
	 * @memberof ExportFormatters
	 */
	static formatDate(dateToFormat) {

		if(!dateToFormat)
			return null;

		const date = new Date(dateToFormat);

		return date.toLocaleString();
	}

	/**
	 * Matches a list of entity ids with a specified entity field
	 * Returns the matched list formatted into a single string
	 *
	 * @param {Array} list The entity ids to filter
	 * @param {Object} entities
	 * @param {string} field The entity field to format
	 * @returns {string}
	 * @memberof ExportFormatters
	 */
	static formatListBy(list, entities, fieldToFormat) {

		return Object.values(entities).reduce((formatted, { id, [fieldToFormat]: item }) => {

			if(!list.includes(id))
				return formatted;
			return formatted ? `${formatted}, ${item}` : item;
		}, '');
	}

}

module.exports = ExportFormatters;
