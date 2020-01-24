'use strict';

const EventEmitter = require('@janiscommerce/event-emitter');

const makeExportEvent = (event, id, client) => EventEmitter.emit({
	entity: 'export',
	event,
	id,
	client
});

module.exports = {
	createdEvent: (id, client) => makeExportEvent('created', id, client),
	processedEvent: (id, client) => makeExportEvent('processed', id, client)
};
