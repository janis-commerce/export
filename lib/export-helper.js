'use strict';

class ExportHelper {

	/**
     * return a list of ids from an entity.
     *
     * @static
     * @param {string} entity
     * @returns
     * @memberof ExportHelper
     */
	static getIds(entity) {

		const ids = new Set();

		this.items.forEach(({ [entity]: itemEntity }) => {

			if(!itemEntity)
				return;

			if(!Array.isArray(itemEntity))
				itemEntity = [itemEntity];

			itemEntity.forEach(id => ids.add(id));
		});

		return [...ids];
	}

	/**
	 * Returns an object with atributte the id of the entity and the value the enitity itself.
	 *
	 * @param {Array} entities
	 * @memberof ExportHelper
	 */
	static mapIdToEntity(entities) {
		return entities.reduce((entityMappedById, entity) => {
			return { ...entityMappedById, [entity.id]: entity };
		}, {});
	}
}

module.exports = ExportHelper;
