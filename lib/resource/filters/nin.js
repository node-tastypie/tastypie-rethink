/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where an array field does not contain any of the specified values
 * @module tastypie-rethink/lib/resource/filters/nin
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__nin=10
 * @example field__nin=foo,bar
 * @example field__nin=foo&field__nin=bar
 */

var toField = require('../../toField')
  , typecast = require('mout/string/typecast')
  , infilter = require('./in')
  ;

module.exports = function nin( r, field, term ){
	return infilter( r, field, term ).not(); 
};
