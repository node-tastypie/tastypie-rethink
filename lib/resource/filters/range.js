/*jshint laxcomma: true, smarttabs: true, node:true, mocha: true*/
'use strict';
/**
 * Restricts a date value between a finite boundry
 * @module rethink-tastypie/lib/resource/filters/range
 * @author Eric Satterwhite
 * @since 2.0.0
 * @requires joi
 * @requires boom
 * @example ?foobar__range=2015-04-01,2015-07-01
 */
var joi       = require('joi')
  , boom      = require('boom')
  , toField = require('../../toField')
  , validator
  ;

validator = joi.array().items( joi.date().format('YYYY-MM-DD' )).length( 2 );

module.exports = function range(r, field, term){
	var result;
	term = Array.isArray( term ) ? term : term.split(',');

	result = validator.validate( term );
	if( result.error ){
		throw result.error;
	} else if( result.value[0] > result.value[1] ){
		// do a real error
		throw boom.badData('Dates out of range');
	};

	return toField( r, field )
		.during( 
			r.time(
				result.value[0].getFullYear()
			  , result.value[0].getMonth() + 1
			  , result.value[0].getDate()
			  , 'Z'
			)
		  , r.time(
		  		result.value[1].getFullYear()
		  	  , result.value[1].getMonth() + 1
		  	  , result.value[1].getDate()
		  	  , 'Z'
		  ) 
		);
}
