
/*jshint laxcomma: true, smarttabs: true, node:true*/
'use strict';
/**
 * filters documents where the field value matches the beginning of the document value
 * @module tastypie-rethink/lib/resource/filters/month
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires tastypie-rethink/lib/toField
 * @example field__month=march
 * @example field__month=december
 */

var toField = require('../../toField')
  , joi = require('joi')
  , validator;

const months = ['january','february','march','april', 'may','june','july', 'august','september','october','november','december'];
validator = joi.string().valid( months ).options({convert:true})
module.exports = function month( r, field, term ){
	let result = validator.validate( term );
	if( result.error ){
		throw result.error	
	}
	return toField(r, field).month( ).eq( r[ result.value ] ) 
};
