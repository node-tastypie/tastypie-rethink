/*jshint laxcomma: true, smarttabs: true, esnext: true, node: true*/
'use strict';
/**
 * Handles nested documents
 * @module tastypie-rethink/lib/fields/docuemnt
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
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

	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle, function(err, value){
			if( err ){
				return cb(err);
			}
			this.instance.full_hydrate( { req:bundle.req, res:bundle.res, data:value}, function(err, result ){
				cb( err, result.object );
			});
		}.bind( this ));
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
			    return cb && cb( err, value );
			}
		    this.instance.full_dehydrate( obj[attribute] ? obj[attribute] : value , null, cb );
		}.bind( this ) );
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
