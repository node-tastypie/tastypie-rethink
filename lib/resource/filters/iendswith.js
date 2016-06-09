/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filter comparing a value to the end of a string in a case insensitive fashion
 * @module tastypie-rethink/lib/resource/filters/iendswith
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__iendswith=ing
 */

var toField = require('../../toField');

module.exports = function iendswith( r, field, term ){ 
	return toField(r, field ).match("(?i)" + term + "$"); 
};
