/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * hasone.js
 * @module hasone.js
 * @author 
 * @since 0.0.1
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 */

var path     = require( 'path' )
  , tastypie = require( 'tastypie' )
  , ApiField = require( 'tastypie/lib/fields/api' )
  , typecast = require( 'mout/string/typecast' )
  , toModule = require( 'tastypie/lib/utility').toModule
  , Class    = tastypie.Class
  , HasOne
  ;

/**
 * Description
 * @class module:hasone.js.Thing
 * @param {TYPE} param
 * @example var x = new hasone.js.THING();
 */

HasOne = new Class({
	inherits: ApiField
	,options:{
		to:null
		,minimal: false
		,full: false
	}

	,is_related: true
	,constructor: function(options){
		this.parent('constructor',options)
		this.instance = new this.cls();
	}
	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle,function( err, value ){
			let isSaved = false;
			value = typecast( value );
			if( !value ){
				return cb(null, value );
			}

			switch(kindOf(value)){
				'string':
					let bits, data;
					// might be a URI
					bits = value.split('/');
					data = {};
					data[this.instance.options.objectTpl._pk] = bits[bits.length-1];
					value = new new this.instance.options.objectTpl( {} );
					isSaved = true;
					break
				'object':
					isSaved = !!value[ this.instance.options.objectTpl._pk ];
					value = new this.instance.options.objectTpl( value );
					break
			}
			
			value.setSaved( isSaved );
			return cb(null, value)

		})
	}
	,dehydrate: function( obj, cb ){}
});

Object.defineProperties(HasOne.prototype,{
	cls: {
		enumerable: false
		,writeable: false
		,get: function(){
			if( typeof this.options.to === 'string'){
				return toModule( this.options.to );
			}

			return null;
		}
	}
});

module.exports = HasOne;
