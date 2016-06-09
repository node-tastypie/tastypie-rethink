/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where the document field matches a specified regex
 * @module tastypie-rethink/lib/resource/filters/regex
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__regex=^A
 * @example field__regex=^b$
 * @example field__regex=(?i)^jo
 */

var toField = require('../../toField')
  ;

module.exports = function regex( r, field, term ){
	return toField(r, term ).match( decodeURIComponent( term ) ); 
};
