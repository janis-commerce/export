'use strict';

const EventEmitter = require('@janiscommerce/event-emitter');

const emitExportEvent = (event, id, client) => EventEmitter.emit({
	entity: 'export',
	event,
	id,
	client
});

module.exports = {
	createdEvent: (id, client) => emitExportEvent('created', id, client),
	processedEvent: (id, client) => emitExportEvent('processed', id, client)
};
