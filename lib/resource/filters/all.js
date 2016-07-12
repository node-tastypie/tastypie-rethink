/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * 
 * @module tastypie-rethink/lib/resource/filters/all
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 */

var toField = require('../../toField')
  , isString = require('mout/lang/isString')
  ;

module.exports = function( r, field, term ){
	term = isString( term ) ? term.split(',') : term;
	var filter = r.row(r, field ).contains( term.shift() );
	while( term.length ){
		filter = filter.and( toField( field ).contains( term.shift() ) );
	}
	return filter;
};
