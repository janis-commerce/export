'use strict';

const path = require('path');

class InstanceGetter {


	getModel(entity) {
		const modelPath = this.getRelativePath(['models', entity]);
		return this.getInstance(modelPath);
	}

	getController(entity) {
		const controllerPath = this.getRelativePath(['controllers', 'export', entity]);
		return this.getInstance(controllerPath);
	}

	getRelativePath(relativePath) {
		return path.join(process.cwd(), process.env.MS_PATH || '', ...relativePath);
	}

	getInstance(classPath) {

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const TheClass = require(classPath);
			return this.session.getSessionInstance(TheClass);
		} catch(e) {
			throw new Error(`Invalid entity. Must be in ${classPath}.`);
		}
	}
}

module.exports = InstanceGetter;
