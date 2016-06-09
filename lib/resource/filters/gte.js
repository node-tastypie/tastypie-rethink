/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters for documents where a field contains a value greater than or equal to the value provided
 * @module tastypie-rethink/lib/resource/filters/gte
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__gte=1
 */

var toField = require('../../toField');

module.exports = function gte( r, field, term ){ 
	return toField(r, field ).ge( term );
};
