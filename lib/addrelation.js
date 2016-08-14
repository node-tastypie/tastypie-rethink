/*jshint laxcomma: true, smarttabs: true, node:true, mocha: true*/
'use strict';
/**
 * A patch for the addRelation function for thinky documents
 * Currently, this is implemented on the query object, but not documents.
 * Adds it if it doesn't exists
 * @module tastypie-rethink/lib/addrelation
 * @author Eric Satterwhite 
 * @since 2.1.0
 * @requires thinky/lib/document
 */

let Document = require('thinky/lib/document');
function addRelation(){
	var pk = this._getModel()._pk;
	var query = this.getModel().get( this[pk]);
	return query.addRelation.apply( query, arguments );
}

Object.defineProperties( Document.prototype, {
	link:{
		get: function(){
			return !!this.__proto__._linked;
		},

		set: function( value ){
			this.__proto__._linked = !!value;
		}
	}
});

Document.prototype.addRelation = Document.prototype.addRelation || addRelation;
