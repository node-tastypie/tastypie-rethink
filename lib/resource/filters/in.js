/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where an array field contains one or more of the specified values
 * @module tastypie-rethink/lib/resource/filters/in
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @requires mout/lang/isString
 * @requires mout/lang/toArray
 * @example field__in=foo
 * @example field__in=foo,bar
 * @example field__in=foo&field__in=bar
 */

var toField = require('../../toField')
  , isString = require('mout/lang/isString')
  , toArray = require('mout/lang/toArray')
  ;

module.exports = function infilter( r, field, term ){
	term = isString( term ) ? term.split(',') : toArray( term );
	var filter = r.row( field ).eq( term.shift() );
	while( term.length ){
		filter = filter.or( r.row( field ).eq( term.shift() ) );
	}
	return filter;
};
