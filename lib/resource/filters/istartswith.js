/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where the field value matches the beginning of the document value in a case insensitive fashion
 * @module tastypie-rethink/lib/resource/filters/istartswith
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__istartswith=foo
 */

var toField = require('../../toField')
  ;

module.exports = function istartswith( r, field, term ){
	return toField(r, field ).match( "(?i)^" + term );
};
