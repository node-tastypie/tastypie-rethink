/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict';
/**
 * hasmany.js
 * @module tastypie-rethink/lib/fields/hasmany
 * @author Eric Satterwhite
 * @since 2.1.0
 * @requires tastypie
 * @requires async
 * @requires mout/object/get
 * @requires debug
 * @requires module:tastypie-rethink/lib/fields/hasone
 */

var tastypie     = require( 'tastypie' )
  , async        = require( 'async' )
  , util         = require( 'util' )
  , get          = require( 'mout/object/get' )
  , toArray      = require( 'mout/lang/toArray' )
  , debug        = require( 'debug')('tastypie:fields:hasmany' )
  , HasOne       = require( './hasone' )
  , Class        = tastypie.Class
  , isFunction   = util.isFunction
  , isString     = util.isString
  , HasMany
  ;

/**
 * Description
 * @constructor
 * @alias module:tastypie-rethink/lib/fields/hasone
 * @param {Object} [options]
 */
HasMany = new Class({
	inherits: HasOne
	,options:{}
	,is_m2m: true
	,constructor: function( options ){
		this.parent('constructor', options );
	}

	,hydrate: function( bundle, cb ){
		this.parent('toValue', bundle, function(err, value){
			
			async.map( 
				toArray( value )
				,this.toInstance.bind( this )
				,cb
			);

		}.bind( this ));
	}

	,dehydrate: function( obj, cb ){
		var that       = this
		   , attribute = this.options.attribute
		   , name      = this.options.name
		   , current
		   ;

		if( !this.instance.options.apiname ){
			debug('setting related apiname - %s', this.resource.options.apiname );
			this.instance.setOptions({
				apiname: this.resource.options.apiname
			});
		}

		switch( typeof attribute ){
			case 'string':
				current = get( obj, attribute );
				if( current == null ){
					if( this.options.default ){
						current = this.options.default;
					} else if( this.options.nullable ){
						current = null;
					}
				}
				current = isFunction( current ) ? current() : current;
				break;
			case 'function':
				current = attribute( obj,  name );
				break;
		}

		async.map(
			current
			, function( obj, callback ){
				if( that.options.full ){
					that.instance.full_dehydrate(
						obj[attribute] || obj
						, null
						, callback
					);
				} else if( that.options.minimal ){
					that.to_minimal( obj[attribute] || obj , callback );
				} else {
					callback( null, obj && that.instance.to_uri( obj )  );
				}
			}
			, cb
		);
	}
});

Object.defineProperty(tastypie.fields, 'hasmany',{
	get:function( ){
		return HasMany;
	}
});

module.exports = HasMany;
	