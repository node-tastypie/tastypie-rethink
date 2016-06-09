/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filter comparing a value exactly
 * @module tastypie-rethink/lib/resource/filters/exact
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__exact=bar
 */

var toField = require('../../toField');

module.exports = function exact( r, field, term ){ 
	return toField(r, field ).eq( term );
};
