/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters for value that match the provided string at any location in a case insensitive fashion
 * @module tastypie-rethink/lib/resource/filters/icontains
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__icontains=HELLO
 */

var toField = require('../../toField');

module.exports = function icontains( r, field, term ){ 
	return toField(r, field ).match( '(?i)' + term );
};
