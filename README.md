# Export

[![Build Status](https://travis-ci.org/janis-commerce/export.svg?branch=master)](https://travis-ci.org/janis-commerce/export)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/export/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/export?branch=master)

A package to handle JANIS Export APIs.

This package will provide an API, and two Listeners to quick config a generic **EXPORT API** in your Microservice.

When It's funcional the API will get documents from Entities in your Microservice, make `.xlsx` files and send email to the user who requested with the data recopiled.

## Installation
```sh
npm install @janiscommerce/export
```

## Configuration

In orden to be functional the Export API needs:

* Model of the Entities which wants to export
* Create Controllers for those entities
* Create a generic API Export
* Create a generic Created Export Listener
* Create a generic Processed Export Listener
* Configure Schemas and Serverless functions

### Models

The Entities models must be in `path/to/root/[MS_PATH]/models/[ENTITY].js`. It are the same for list, get or save in your microservice.

* `MS_PATH` : environment variable. Usually `src`.
* `ENTITY` : entity name

#### Example

```js
'use strict';

const Model = require('@janiscommerce/model');

class CatModel extends Model {
    static get table() {
		return 'cats';
	}
}

module.exports = CatModel;
```

### Controllers

The Entities Controllers for Export must be in `path/to/root/[MS_PATH]/controllers/export/[ENTITY].js`.
It must extend from `ControllerExport`.

* `MS_PATH` : environment variable. Usually `src`.
* `ENTITY` : entity name

#### Customize

There are a few options to customize the exports.

* *getter* `pageLimit`

  Returns `{ number }`. Default `5000`.
  It is the Pagination Limit to obtain documents from Database

* *getter* `fileLimit`

  Returns `{ number} `. Default `25000`.
  It is the Document Limit to make the files.

* *getter* `excludeField`

  Returns `{ [String] }`. Default `[]`.
  It is a List of field to exclude from the file creation.

* *async* `formatByPage(items)`.

  Returns `{ [Object] }`. Default `items`.
  Format Items by Page after getting from Database.

* *async* `formatByFile(items)`.

  Returns `{ [Object] }`. Default `items`.
  Format Items before making the file.

#### Example

```js
'use strict';

const { ControllerExport } = require('@janiscommerce/export');

class CatController extends ControllerExport {

  get pageLimit() {
		return 100; // Will get pages with 100 documents max
	}

	get fileLimit() {
		return 1000000; // Will create files with 1 millon documents max
	}

	get excludeField() {
		return ['id']; // Will exclude 'id' field
  }

  async formatByPage(items) {
		return items.map(({ keywords, ...item}) => ({ ... item, keywords: keywords.toLowerCase() }));
  }

  async formatByFile(items) {
		return items.map(item) => ({ ... item, status: 'alive' }));
	}
}

module.exports = CatController;
```

### API

Only need to require `ApiExport` and export it. It needs to use `LoggedAuthorizer`.

```js
'use strict';

const { ApiExport } = require('@janiscommerce/export');

module.exports = ApiExport;
```

### Created Listener

Only need to require `CreatedListener` and extend your class, for basic use.

#### Customize

There are a few options to customize the exports.

* *async* `preProcess(exportDocument)`.

  Params: `exportDocument`, the export options.
  Method to do something before the export process.

* *async* `postSaveHook(exportDocumentSaved)`.

  Params: `exportDocument`, the export options.
  Method to do something after the export process.

#### Example

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { CreatedListener } = require('@janiscommerce/export');
const EventEmitter = require('@janiscommerce/event-emitter');

class ExportCreatedListener extends CreatedListener {

  async preProcess({id, entity}) {
		return EventEmitter.emit({
      entity,
      event: 'export-started'.
      id
    })
  }

  async postSaveHook({id, entity) {
		return EventEmitter.emit({
      entity,
      event: 'export-finished'.
      id
    })
	}
}

module.exports.handler = (...args) => ServerlessHandler.handle(ExportCreatedListener, ...args);
```

### Processed Listener

Only need to require `ProccesedListener` and export it.

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ProccesedListener } = require('@janiscommerce/export');

module.exports.handler = (...args) => ServerlessHandler.handle(ProccesedListener, ...args);
```

## Usage

For Start Exporting data `ApiExport` received in the body:

* entity: `{string}`, name of the entity
* filters: `{object}`, object with name of the fields and its values as *key/value*.
* sortBy: `{string}`, name of the field to sort by.
* sortDirection: `{'asc' | 'ASC' | 'desc' | 'DESC'}`, direction of the sorting

#### Example

```js
{
  entity: 'cats'
  filters: {
    region: 'europe'
    gender: 'female'
  },
  sortBy: 'color',
  sortDirection: 'desc'
}
```
