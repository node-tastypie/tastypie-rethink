/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true, unused: true*/
'use strict';
/**
 * Field type to handle hasone / belongsto fields for thinky models
 * @module tastypie-rethink/lib/fields/hasone
 * @author Eric Satterwhite
 * @since 2.1.0
 * @requires path
 * @requires tastypie
 * @requires tastypie/lib/fields/api
 * @requires mout/string/typecast
 * @requires tastypie/lib/utility
 */

require('../addrelation'); // patch thinky document#addRelation
var tastypie = require( 'tastypie' )
  , ApiField = require( 'tastypie/lib/fields/api' )
  , typecast = require( 'mout/string/typecast' )
  , kindOf   = require('mout/lang/kindOf')
  , toModule = require( 'tastypie/lib/utility').toModule
  , Class    = tastypie.Class
  , HasOne
  ;

/**
 * @constructor
 * @alias module:tastypie-rethink/lib/fields/hasone
 * @param {Object} options
 * @param {?module:tastypie/lib/resource} to A resource class to represent a related object
 * @param {Boolean} [full=false] If set to tree the entire value of the related resoures will be returned
 * @param {Boolean} [minimal=false] If set to true and `full` is set to false, a minimalistic representation of the related resource will be returned - including the id field, uri field, and a single display value
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
		this.parent('constructor',options);
		this.instance = new this.cls();
	}
	/**
	 * Converts a serialized value into a full resource instance value
	 * @method module:tastypie-rethink/lib/fields/hasone#hydrate
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 **/
	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle,function( err, value ){
			return this.toInstance( value, cb );
		}.bind(this));
	}

	,toValue: function( bundle, cb ){
		this.parent('hydrate', bundle, cb );
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

	/**
	 * Used to distil an object in to something suitable for serialization
	 * @method module:tastypie-rethink/lib/fields/hasone#dehydrate
	 * @param {Mixed} obj A value to dehydrate
	 * @param {Function} callback A node style callback to be called when execution is complete
	 **/
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
	 * @method module:tastypie-rethink/lib/field/hasone#to_minimal
	 * @param {Object} obj A template object instance to introspect
	 * @param {Function} callback A node style call back to be called when execution is complete
	 **/
	,to_minimal: function( obj, cb ){

	    var label = this.instance.options.labelField || 'display'
	      , related_field
	      ;

	    related_field = this.instance.fields[label];
	    related_field.dehydrate( obj, this._to_minimal.bind(this, obj, related_field, label, cb ));
	}
	/**
	 * Used to construct a minimal representation of an object 
	 * @private
	 * @method module:tastypie/rethink/lib/fields/hasone#_to_minimal
	 * @param {Object} obj
	 * @param {module:tastypie/lib/field/related} field The field instance from the related resource being dehydrated
	 * @param {String} label The name of the field being dehydrated
	 * @param {Function} callback The callback function to be executed when execution is complete
	 * @param {Error} [?err] An error object from previous field dehydration
	 * @param {Object} value The value of the field in question
	 **/
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
});

module.exports = HasOne;
