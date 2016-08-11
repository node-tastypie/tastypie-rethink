/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where the field value matches the beginning of the document value
 * @module tastypie-rethink/lib/resource/filters/year
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires tastypie-rethink/lib/toField
 * @example field__year=1988
 */

var toField = require('../../toField');

module.exports = function size( r, field, term ){
	return toField(r, field ).year( ).eq(Math.floor( Number( term ) ) ); 
}
