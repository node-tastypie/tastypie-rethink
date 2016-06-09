/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filter comparing a value to the end of a string
 * @module tastypie-rethink/lib/resource/filters/endswith
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__endswith=bar
 */

var toField = require('../../toField');

module.exports = function endswith( r, field, term ){ 
	return toField( r, field ).match( term + "$" );
};
