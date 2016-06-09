/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filters documents were the document field value is less than or equal to the specified value
 * @module tastypie-rethink/lib/resource/filters/lte
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__lte=10
 */

var toField = require('../../toField')
  ;

module.exports = function lte( r, field, term ){
	return toField(r, field ).le( term );
};
