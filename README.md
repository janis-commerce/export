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

* Model of Export and the Entities which wants to export
* Create Controllers for those entities
* Create a generic API Export (:warning: since version 2.0.0 major changes - now it uses lambda functions)
* Export process lambda function.
* Create a generic Created Export Listener (:warning: deprecated since version 2.0.0)
* Create a generic Processed Export Listener (:warning: deprecated since version 2.0.0)
* Configure Schemas, and Serverless functions
* Configure Events (:warning: deprecated since version 2.0.0)
* Configure `.nycrc` to avoid coverage leaks

### ENV vars

Needs to be setup

* `JANIS_SERVICE_NAME`, Service Name
* `JANIS_ENV`, Environment

In order to use S3 Bucket

### Models

* First needs the `ModelExport` from the package, in `path/to/root/[MS_PATH]/models/export.js`

#### Example

```js
'use strict';

const { ModelExport } = require('@janiscommerce/export');

module.exports = ModelExport;
```

* The Entities models must be in `path/to/root/[MS_PATH]/models/[ENTITY].js`. It are the same for list, get or save in your microservice.
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

* *getter* `fileUrlExpirationTime`

  Returns `{ number} `. Default `86400`.
  It is the Expiration Time to be available to download. In Seconds, one day be default.

* *async* `format(item)`.

  Returns `{ Object }`. Default `item`.
  Format Item Individually after getting from Database.

* *async* `formatByPage(items)`.

  Returns `{ [Object] }`. Default `items`.
  Format Items by Page after getting from Database.

* *async* `formatByFile(items)`.

  Returns `{ [Object] }`. Default `items`.
  Format Items before making the file.

* `formatFilters(filters)`.

  Returns `{ Object }`. Default `filters`.
  Customize filters to get records from database

#### File Fields / Headers
By Default, Every field in the items getted will be include in the files as headers of each column.

But it can be changed by only one of these getters at a time:

* *getter* `fields`

  Returns `{ [String] } `. Default `[]`.
  A List of fields to include in the File. It has high priority

* *getter* `excludeFields`

  Returns `{ [String] } `. Default `[]`.
  A List of fields to exclude in the File. If `fields` has elements Its will be ignored

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

  get fileLimit() {
		return 1000000; // Will create files with 1 millon documents max
  }

  get fileUrlExpirationTime() {
    return 3600; // Download will be available for 1 hour
  }

	get excludeFields() {
		return ['name']; // Will try to exclude 'name' field, but because 'fields' method has elements it will be ignored
  }

  async format(item) {
    return {...item, userProfile: this.session.profileId };
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

Only need to require `ApiExport` and export it.

```js
'use strict';

const { ApiExport } = require('@janiscommerce/export');

module.exports = ApiExport;
```

### Export process

Only need to require `ExportProcess` and extend your class, for basic use.

#### Customize

There are a few options to customize the exports.

* *async* `preProcess(exportDocument)`.

  Params: `exportDocument`, the export options.
  Method to do something before the export process starts, like Emit an event or saved in Database or Cache, some other validation.

* *async* `postProcess(exportDocumentSaved)`.

  Params: `exportDocumentSaved`, the export options.
  Method to do something after the export process was created and files are uploaded, like Emit an event or saved in Database or Cache, some other validation.

Export Document have the options which will be used to get the data:
* `entity`, Entity name
* `filters`, filters to be used
* `sortBy`, fields to be sorted by
* `sortDirection`, sort direction (`asc` or `desc`)
* `userCreated` ID of User who request the export
* `userEmail` User Email which will be used to send the data
* `dateCreated`

In `path/to/root/[MS_PATH]/lambda/ExportProcess/index.js`.


#### Example

```js
'use strict';

const { Handler } = require('@janiscommerce/lambda');
const { ExportProcess } = require('@janiscommerce/export');
const EventEmitter = require('@janiscommerce/event-emitter');

class MyExportProcess extends ExportProcess {

  async preProcess({id, entity}) {
		return EventEmitter.emit({
      entity,
      event: 'export-started'.
      id
    });
  }

  async postProcess({id, entity}) {
		return EventEmitter.emit({
      entity,
      event: 'export-finished'.
      id
    });
	}
}

module.exports.handler = (...args) => Handler.handle(MyExportProcess, ...args);
```

### Export serverless

In `path/to/root/serverless.js` add:

:bulb: It is important to send as a parameter the service name. For example: 'wms'

```js
'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line
const functions = require('./serverless/functions.json');
const { exportServerless } =  require('@janiscommerce/export');

module.exports = helper({
	hooks: [
		// other hooks
        ...functions,
        ...exportServerless('wms')
	]
});
```

:bulb: Do not forget to add the [IAM Statement Permissions](https://www.npmjs.com/package/@janiscommerce/lambda).

### Schemas

In `path/to/root/schemas/src/public/export` add:

* [`base.yml` file](docs/schemas/export/base.yml)
* [`post.yml` file](docs/schemas/export/post.yml)


### `.nycrc`

Create or update `./.nycrc` to avoid coverage leaks:

```
{
  "exclude": [
    //... your files
    "src/models/export.js",
    "src/api/export/post.js",
    "src/lambda/ExportProcess.js"
  ]
}
```

:warning: If exists any customization of the files, do not add the file to the .nyrcr and add the corresponding tests.



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


### Export Tools

Implementing several exports in services may lead to some code repetition. In order to avoid this repetition the package provides some usefull tools. 


#### ExportHelper

The `get` method should be redefined. You should get an array of ids from an specified field from the entity (using getIds for example) and then get the entitys from a model or using the Microservice-call package.

Sometimes it is useful to return an object in which the keys ar the ids and the values are the entities getted from model or from the microservice-call.

Methods:

* static *getIds* - return a list of ids from an entity.

* static *mapIdToEntity* - Returns an object with attribute the id of the entity and the value the entity itself.

Usage

```js
const { ExportHelper } = require('@janiscommerce/export');
const { MsCall } = require('@janiscommerce/microservice-call);

class AirlineHelper extends ExportHelper {

  get(items, session) {

    // important!! define this.items
    this.items = items;

    const airlinesIds = this.getIds('airlineId');

    if(! airlinesIds.length)// to avoid unneed requests
      return {};

    const msCall = session.getSessionInstance(MsCall);

    const { body, statusCode } = await microServiceCall.safeList('InternationalAirlines', 'airline', { filters: { id: airlinesIds } );

    if(statusCode >= 400)
     return {};

    return this.mapIdToEntity(body)
  }
}
```

#### UserHelper

Is an implementation of the Export Helper in which the microservice call to the service Id and the getIds selecting userCreated and userModified are already implemented.

Methods:

* static *getUsers* - return a object with entity data for userCerated and userModified. if fail request, return a empty object.

:warning: It returns the users formatted in an object which keys are the ids and the values the user itself.


#### Formatters

Some data is required to be formatted in a special way repetitively in every entity. The export package provides with a static format to help with the formatting.

* static *formatDate(date)* - returns a string with the date formatted like: 'DD/MM/YY HH-MM'.
* static *formatUser(user)* - returns a string with the user's full name and email formatted like: ' name - lastName - email'
* static *formatListBy(listIds, entities, field)* - returns a string with the `field` value from the entity separated by commas. Only if the entity id is included in the listIds.


#### Example of a controller using all the tools: 

```js
const { ControllerExport, UserHelper, ExportFormatters } = require('@janiscommerce/export');
const { AirlineHelper } = require('../helpers/airline-helper');

class FligthController extends ControllerExport {

  async formatByPage(items){

      await setAirlines(items);
      await setUsers(items);

      return items.map(flight => ({
        airline: this.airlines[flight.airlineId].name,
        aliance: this.airlines[flight.airlineId].aliance,
        userCreated: ExportFormatters.formatUser(this.users[flight.userCreated]),
        dateCreated: ExportFormatters.formatDate(flight.dateCreated)
      }))
  }

  async setAirlines(items, session) {
    this.airlines = await AirlineHelper.get(items, session);
  }

  async setUsers(items, session){
    this.users = await UserHelper.getUsers(items, session);
  }
}

module.exports = FlightController;
```



## :warning: :skull: Deprecated

Since version 2.0.0 the package does not use events. Instead uses the[@janiscommerce/lambda](https://www.npmjs.com/package/@janiscommerce/lambda) package.

### Created Listener (:warning: Since version 2.0.0 deprecated)

Only need to require `CreatedListener` and extend your class, for basic use.

#### Customize

There are a few options to customize the exports.

* *async* `preProcess(exportDocument)`.

  Params: `exportDocument`, the export options.
  Method to do something before the export process starts, like Emit an event or saved in Database or Cache, some other validation.

* *async* `postProcess(exportDocumentSaved)`.

  Params: `exportDocumentSaved`, the export options.
  Method to do something after the export process was created and files are uploaded, like Emit an event or saved in Database or Cache, some other validation.

Export Document have the options which will be used to get the data:
* `entity`, Entity name
* `filters`, filters to be used
* `sortBy`, fields to be sorted by
* `sortDirection`, sort direction (`asc` or `desc`)
* `userCreated` ID of User who request the export
* `userEmail` User Email which will be used to send the data
* `dateCreated`
* `dateModified`

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
    });
  }

  async postSaveHook({id, entity}) {
		return EventEmitter.emit({
      entity,
      event: 'export-finished'.
      id
    });
	}
}

module.exports.handler = (...args) => ServerlessHandler.handle(ExportCreatedListener, ...args);
```

### Processed Listener (:warning: Since version 2.0.0 deprecated)

Only need to require `ProcessedListener` and export it.

```js
'use strict';

const { ServerlessHandler } = require('@janiscommerce/event-listener');
const { ProcessedListener } = require('@janiscommerce/export');

module.exports.handler = (...args) => ServerlessHandler.handle(ProcsesedListener, ...args);
```

### Events (:warning: Since version 2.0.0 deprecated)

* In `path/to/root/events/events.yml`, must add [this](docs/events/events.yml)

* In `path/to/root/events/src/{your-service}/export/created.yml`, must add [this file](docs/events/src/export/created.yml)
* In `path/to/root/events/src/{your-service}/export/processed.yml`, must add [this file](docs/events/src/export/processed.yml)