# Export

[![Build Status](https://travis-ci.org/janis-commerce/export.svg?branch=master)](https://travis-ci.org/janis-commerce/export)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/export/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/export?branch=master)

A package to handle JANIS Export APIs.

This package will provied an API, and two Listeners to quick config a generic **EXPORT API** in yout Microservice.

When It's funcional the API will get registries from Entities in your Microservice and send email to the user the data recopiled.

## Installation
```sh
npm install @janiscommerce/export
```

## Configuration

In orden to be functional the Export API needs:

* Model of the Entities which wants to export
* Controller to avaible export function
* Import `ApiExport`
* Config schemas and serverless function for `ApiExport` with POST method and `LoggedAuthorizer`.

### Models

The Entities models must be in `path/to/root/[MS_PATH]/models/[ENTITY].js`

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

The Entities Controllers must be in `path/to/root/[MS_PATH]/controllers/export/[ENTITY].js`

* `MS_PATH` : environment variable. Usually `src`.
* `ENTITY` : entity name

#### Example

```js
'use strict';

class CatController {}

module.exports = CatController;
```

### API

Only need to require `ApiExport` and export it.

```js
'use strict';

const { ApiExport } = require('@janiscommerce/export');

module.exports = ApiExport;
```

## Usage

API Export received in the body:

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
