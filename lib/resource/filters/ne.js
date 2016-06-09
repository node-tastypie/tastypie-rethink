/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filters documents where the document field value is not equal to the specified Value
 * @module tastypie-rethink/lib/resource/filters/ne
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__ne=10
 */

var toField = require('../../toField')
  , typecast = require('mout/string/typecast')
  ;

module.exports = function ne( r, field, term ){
	return toField( r, field ).ne( typecast( term ) );
};
