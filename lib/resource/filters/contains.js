/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters for value that match the provided string at any location
 * @module tastypie-rethink/lib/resource/filters/contains
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__contains=foo
 * @example field__contains=bar
 * @example field__contains=oo
 * @example field__contains=ar
 */

var toField = require('../../toField');

module.exports = function contains( r, field, term ){ 
	return toField(r, field ).match( term ); 
};
