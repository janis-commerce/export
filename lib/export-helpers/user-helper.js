'use strict';

const MsCall = require('@janiscommerce/microservice-call');
const ExportHelper = require('./export-helper');

class ExportUserHelper extends ExportHelper {

	/**
	 *
	 * @static
	 * @param {Array} items
	 * @param {Object} session
	 * @returns
	 * @memberof ExportUserHelper
	 */
	static async getUsers(items, session) {
		this.items = items;

		const userIds = this.getIds();

		if(!userIds.length)
			return {};

		const microServiceCall = session.getSessionInstance(MsCall);

		const { body: users, statusCode } = await microServiceCall.safeList('id', 'user', { filters: { id: userIds } });

		if(statusCode >= 400)
			return {};

		return this.mapIdToEntity(users);
	}

	/**
     * return a list of ids from users.
     *
     * @static
     * @param {string} entity
     * @returns
     * @memberof ExportUserHelper
     */
	static getIds() {

		const ids = new Set();

		this.items.forEach(({ userCreated, userModified }) => {

			if(userCreated)
				ids.add(userCreated);

			if(userModified)
				ids.add(userModified);
		});

		return [...ids];
	}
}

module.exports = ExportUserHelper;
