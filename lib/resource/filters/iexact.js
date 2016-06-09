/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filter comparing a value exactly in a case insensitive fashion
 * @module tastypie-rethink/lib/resource/filters/iexact
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__iexact=FoOBar
 */

var toField = require('../../toField');

module.exports = function iexact( r, field, term ){ 
	return toField(r, field ).match( "(?i)" + term); 
};
