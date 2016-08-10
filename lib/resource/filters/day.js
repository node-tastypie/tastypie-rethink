/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where the field value matches the beginning of the document value
 * @module tastypie-rethink/lib/resource/filters/day
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires tastypie-rethink/lib/toField
 * @example field__day=monday
 * @example field__day=tuesday
 */

var toField = require('../../toField')
  , joi = require('joi')
  , validator;

const days = ['monday', 'tuesday', 'wednesday','thursday','friday','saturday','sunday'];
validator = joi.string().valid( days ).options({convert:true})
module.exports = function day( r, field, term ){
	let result = validator.validate( term );
	if( result.error ){
		throw result.error;
	}
	return toField(r, field).dayOfWeek( ).eq( r[ result.value ] ) 
};
