/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * Filters documents where an array field contains exactly the specified number of elements
 * @module tastypie-rethink/lib/resource/filters/size
 * @author Eric Satterwhite
 * @since 2.0.1
 * @requires tastypie-rethink/lib/toField
 * @example field__size=10
 */

var toField = require('../../toField')
  ;

module.exports = function size( r, field, term ){
	return toField(r, field ).count().eq( term );
};
