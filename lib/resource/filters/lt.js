/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filters documents were the document field value is less than the specified value
 * @module tastypie-rethink/lib/resource/filters/lt
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__lt=10
 */

var toField = require('../../toField')
  ;

module.exports = function lt( r, field, term ){
	return toField(r, field ).lt( term );
};
