# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2020-09-01
### Added
- GitHub Actions for worflows build, coverage, publish

### Changed
- Upgraded `@janiscommerce/model` up to `^5.0.0`
- Upgraded `@janiscommerce/lambda` up to `^3.0.0`
- Upgraded `@janiscommerce/api-save` up to `^6.0.0`

## [2.0.2] - 2020-06-19
### Changed
- Updated `@janiscommerce/lambda` version

### Fixed
- `README.md` fixes

## [2.0.1] - 2020-06-17
### Changed
- API Save dependency upgraded to v5 (`api-session` validates locations)

## [2.0.0] - 2020-06-04
### Added
- Export-Serverless getter - add serverless hooks and  iamStatements.
- Export-process - lambda function instead of events.

### Changed
- API-export - now uses lambda instead of events.

### Removed
- Created Listener - now uses export process
- Processed Listener - now uses export process
- Docs events

## [1.4.1] - 2020-05-19
### Changed
- Updated sinon dependency

## [1.4.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [1.3.0] - 2020-05-15
### Added
- `UserHelper` for getting and format users
- `ExportHelper` for common uses
- `ExportFormatters` with useful formatters

### Changed
- Model Export does not creates logs

## [1.2.0] - 2020-04-24
### Added
- Optional formatFilters method for controllers

## [1.1.2] - 2020-04-23
### Fixed
- Added serverless functions with serviceName as parameter

## [1.1.1] - 2020-04-23
### Fixed
- Variable serviceCode in functions

## [1.1.0] - 2020-04-23
### Added
- Export statuses to avoid duplicated export operations
- Lambda functions definitions for serverless

## [1.0.0] - 2020-02-11
### Added
- Export Model
- Export Controller
- API Export
- Created Listener
- Process Listener
