/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters for documents where a field contains a value greater than the value provided
 * @module tastypie-rethink/lib/resource/filters/gt
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__gt=1
 */

var toField = require('../../toField');

module.exports = function gt( r, field, term ){ 
	return toField(r, field).gt( term );
};
