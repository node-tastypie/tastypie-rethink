/*jshint laxcomma: true, smarttabs: true, esnext: true, node: true*/
'use strict';
/**
 * Handles nested documents
 * @module tastypie-rethink/lib/fields/docuemnt
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 * @requires tastypie/lib/utility
 */

let tastypie = require( 'tastypie' )
  , ApiField = require( 'tastypie/lib/fields/api' )
  , toModule = require( 'tastypie/lib/utility' ).toModule
  , Class = tastypie.Class
  , Document
  ;

/**
 * @constructor
 * @alias module:tastypie-rethink/lib/fields/document
 * @param {Object} options
 * @param {module:tastypie/lib/resource} options.to A resource class to represent a related object
 * @param {String|Number|Function} [options.default=Object.create(null)] Default value for the field value
 */
Document = new Class({
	inherits: ApiField
	,options:{
		to: null
		,default: function(){
			return Object.create(null)
		}
	}
	,constructor: function( options ){
		this.parent('constructor', options );
		this.instance = new this.cls();
	}

	/**
	 * Converts a serialized value into a full resource instance value
	 * @method module:tastypie-rethink/lib/fields/document#hydrate
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 **/
	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle,(err, value) => {
			if( err ){
				return cb(err);
			}
			this.instance.full_hydrate( { req:bundle.req, res:bundle.res, data:value}, ( err, result ) => {
				cb( err, result.object );
			});
		});
	}
	
	/**
	 * Used to distil an object in to something suitable for serialization
	 * @method module:tastypie-rethink/lib/field/document#to_minimal
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
		this.parent('dehydrate',obj, ( err, value ) => {
			if( err || !value ){
			    return cb && cb( err, value );
			}
		    this.instance.full_dehydrate( obj[attribute] ? obj[attribute] : value , null, cb );
		});
	}
});

Object.defineProperties(Document.prototype,{
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

Object.defineProperty(tastypie.fields, 'document', {
	configurable:false
	,get: function(){
		return Document;
	}
});

module.exports = Document;
