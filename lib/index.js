/**
 * Resource Class for Tastypie and thinky 
 * @module tatsypie-rethink/lib
 * @requires tastypie-rethink/lib/resource
 * @requires tastypie-rethink/lib/fields
 **/

/**
 * @property {module:tastypie-rethink/lib/resource} Resource The main resource type
 * @property {module:tastypie-rethink/lib/fields} fields Defined field types for the rethink resource
 **/
exports.Resource = require('./resource')
exports.fields = require('./fields')
