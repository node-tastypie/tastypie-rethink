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

require('../addrelation') // patch thinky document#addRelation
var path     = require( 'path' )
  , tastypie = require( 'tastypie' )
  , ApiField = require( 'tastypie/lib/fields/api' )
  , typecast = require( 'mout/string/typecast' )
  , kindOf        = require('mout/lang/kindOf')
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
			return this.toInstance( value, cb );
		}.bind(this));
	}

	,toValue: function( bundle, cb ){
		this.parent('hydrate', bundle, cb )
	}
	,toInstance: function( value, cb ){
		let saved = false;
		value = typecast( value );
		if( !value ){
			return cb(null, value);
		}

		switch(kindOf(value)){
			case 'String':
				let bits, data;
				// might be a URI
				bits = value.split('/');
				data = {};
				data[this.instance.options.objectTpl._pk] = bits[bits.length-1];
				value = new this.instance.options.objectTpl( data );
				saved = true;
				break;
			case 'Object':
				saved = !!value[ this.instance.options.objectTpl._pk ];
				value = new this.instance.options.objectTpl( value );
				break;
		}

		saved ? cb( null, value) : value.save( cb );
	}
	,dehydrate: function( obj, cb ){
		if( !this.instance.options.apiname ){
		    this.instance.setOptions({
		        apiname: this.resource.options.apiname
		    });
		}
		obj = obj.toJSON ? obj.toJSON() : obj;

		var attribute = this.options.name;
		this.parent('dehydrate',obj, function( err, value ){
			if( err || !value ){
			    return cb && cb( err, null );
			}
			
			if( this.options.full ){
			    this.instance.full_dehydrate( obj[attribute] ? obj[attribute] : value , null, cb );
			} else if( this.options.minimal ){
			    this.to_minimal( obj[attribute] ? obj[attribute] : value , cb );
			} else {
			    cb( err, value && this.instance.to_uri( value )  );
			}

		}.bind( this ) );
	}

	/**
	 * converts a full object in to a minimal representation
	 * @method module:tastypie-bookshelf/lib/field/related#to_minimal
	 * @param {Object} obj A template object instance to introspect
	 * @return {String} DESCRIPTION
	 **/
	,to_minimal: function( obj, cb ){

	    var label = this.instance.options.labelField || 'display'
	      , related_field
	      ;

	    related_field = this.instance.fields[label];
	    related_field.dehydrate( obj, this._to_minimal.bind(this, obj, related_field, label, cb ));
	}

	,_to_minimal: function( obj, related_field, label, cb, err, value ){
	    var out = {};
	    out.uri =  this.instance.to_uri( obj );
	    out.id = this.instance.pk( obj );
	    out[  label ] = value;
	    label = related_field = null;
	    cb( null, out );
	}
});

Object.defineProperties(HasOne.prototype,{
	cls: {
		enumerable: false
		,writeable: false
		,get: function(){
			if( typeof this.options.to === 'string'){
				return toModule( this.options.to );
			}

			return this.options.to;
		}
	}
});
Object.defineProperty(tastypie.fields,'hasone',{
    get:function(){
        return HasOne;
    }
})
module.exports = HasOne;
