/*jshint laxcomma: true, smarttabs: true, node: true, unused: true , esnext: true*/
'use strict';
/**
 * A resource instance using rethinkdb via thinky as a data source
 * @module tastypie/lib/resource/rethink
 * @author Eric Satterwhite
 * @since 0.3.2
 * @requires util
 * @requires joi
 * @requires debug
 * @requires mout/lang/isNumber
 * @requires mout/lang/toArray
 * @requires mout/lang/merge
 * @requires tastypie/lib/class
 * @requires tastypie/lib/options
 * @requires tastypie/lib/http
 * @requires tastypie/lib/resource
 */

var http          = require('tastypie/lib/http')
  , Boom          = require( 'boom' )
  , async         = require('async')
  , isNumber      = require('mout/lang/isNumber')
  , toArray       = require('mout/lang/toArray')
  , isFunction    = require('mout/lang/isFunction')
  , typecast      = require('mout/string/typecast')
  , set           = require('mout/object/set')
  , collect       = require('mout/array/collect')
  , Class         = require('tastypie/lib/class')
  , Options       = require('tastypie/lib/class/options')
  , Resource      = require('tastypie/lib/resource')
  , Paginator     = require('tastypie/lib/paginator')
  , constants     = require('tastypie/lib/constants')
  , debug         = require( 'debug' )('tastypie:resource:rethink')
  , terms         = require('./filters')
  , RethinkResource
  ;

const PATCH = 'patch';
const SEP           = '__';
const orderExp      = /^(\-)?([\w]+)/;
const EMPTY_ARRAY   = [];
const EMPTY_OBJECT  = Object.freeze( {} );
require('../fields/hasone');
require('../fields/hasmany');
require('../fields/document');

/**
 * Returns a function that allow for afunction to accept either a (key, value )signature or a ({key1:value1, key2:value2}) signature
 * @paran {Function} fn the function to overload
 * @return {Function} a function wrapper around the original function
 */
function overload( fn ){

	return function overloadedSetter( keyOrObj, value ){

		if( typeof keyOrObj !== 'string' ){
			for( var key in keyOrObj ){
				fn.call( this, key, keyOrObj[key ]);
			}
		}else{
			fn.call(this, keyOrObj, value );
		}
		return this;
	};
}
/**
 * @alias module:tastypie/lib/resource/rethink
 * @constructor
 * @param {Object} options
 * @param {String} [options.pk=id] property to be considered the primary key field of the associated model
 * @extends module:tastypie/lib/resource
 * @example
var SampleResource = new Class({
	inherits:RethinkResource
	,options:{
		queryset: Sample.filter({})
	}
	,fields:{
		age:{type:'integer', null:true, attribute:'age'}
	}
});
 */
module.exports = RethinkResource = new Class({
	inherits:Resource
	,mixin:[Options]
	,options:{
		queryset:null
		,pk:'id'
		,objectTpl:null
		,paginator: Paginator.Remote
		,max:1000
	}

	,constructor: function( options ){

		this.parent( 'constructor', options );

		this.options.objectTpl = this.options.objectTpl || this.options.queryset._model;
		var paths = Object.keys( this.fields || this.options.queryset._model._schema._schema );
		this.allowablepaths = paths.filter(function(p){
			return p !== 'id';
		});

		paths = null;
	}


	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, get_list: function get_list( bundle ){
		var query = this.options.queryset.filter({})
		  , that = this
		  , filters
		  ;
		
		try{
			filters = this.buildFilters( bundle.req.query );
		} catch( err ){
			err.req = bundle.req;
			err.res = bundle.res;
			return this.emit('error', err);
		}

		query = query.filter( filters );
		query.count().execute( function( err, count ){

			var paginator
			  , to_be_serialized
			  ;
			
			try{
				query = this.sort( query, bundle.req.query );
				query = this.offset( query, bundle );
				query = this.limit( query, bundle );
			} catch( err ){
				err.req = bundle.req;
				err.res = bundle.res;
				return that.emit('error', err );
			}
			query.run( function( err, objects ){
				objects = objects || [];
				if(err){
					err.req=bundle.req;
					err.res=bundle.res;
					return that.emit('error', err );
				}
				paginator = new that.options.paginator({
					limit:bundle.req.query.limit
					,req:bundle.req
					,res:bundle.res
					,collectionName:that.options.collection
					,objects:objects
					,count: count
					,offset: bundle.req.query.offset || 0
				});

				to_be_serialized = paginator.page();
				async.map( to_be_serialized[ that.options.collection ], function(item, done){
					return that.full_dehydrate( item, bundle, done );
				}, function(err, results ){
					to_be_serialized[ that.options.collection ] = results;
					bundle.data = to_be_serialized;
					paginator = to_be_serialized = null;
					return that.respond( bundle );
				});
			});
		}.bind( this ));
	}


	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, delete_detail: function delete_detail( bundle ){
		var that = this;
		this.get_object(bundle, function( err, instance ){
			if( err ){
				err.req = bundle.req;
				err.res = bundle.res;
				return that.emit('error', err  );
			}

			if( !instance ){
				bundle.data = {message:'not found',code:404};
				return that.respond(bundle,http.notFound );
			}

			if(!that.options.returnData ){
				bundle.data = null;
				var response = http.noContent;
				return that.respond( bundle, response );
			}

			bundle.object = instance;
			that.full_dehydrate( bundle.object, bundle, function( err, data ){
				bundle.data = data;
				that.cache.set(bundle.toKey( 'detail') , null );
				instance.purge().then(function(){
					return that.respond( bundle );
				});
			});
		});
	}


	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, create_object: function create_object( bundle, callback ){
		var that = this
		  ;

		bundle.object = new that.options.queryset._model({});
		that.full_hydrate( bundle, function( hyd_err, bndl ){
			
			if( hyd_err ){
				debug( hyd_err );
				return callback( hyd_err );
			}



			(bndl.object.isSaved() ? Promise.resolve( bundle.object) : bndl.object.saveAll())
			.then( function( value ){
				bndl.object = value;
				return callback && callback( null, bndl );
			})
			.catch(callback);
		});
	}

	, get_object: function( bundle, callback ){
		var filter = {};
		filter[ this.options.pk ] = bundle.req.params.pk;

		this.options
			.queryset
			.filter( filter )
			.run( function( err, results ){
				return callback && callback( err, results[0]);
			} );

		filter = null;
		return this;
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, update_object: function( bundle, callback ){
		var that = this;
		this.get_object( bundle, function( err, obj ){

			if( err || !obj ){
				if( err ){
					err.req = bundle.req;
					err.res = bundle.res;
					return this.emit('error',err);
				}

				bundle.data = {message:'not found',code:404};
				return that.respond(bundle,http.notFound );
			}

			bundle.object = obj;
			that.full_hydrate( bundle, function( err, bndl ){
				bndl.object.saveAll(function(err){
					return callback && callback( err, bndl );
				});
			});
		}.bind( this ) );
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, full_hydrate: function( bundle, done ){
		var Tpl        = this.options.objectTpl
		  , method     = this.check( 'verb', bundle )
		  , promises   = []
		  , flds
		  ;

		flds = method === PATCH ? ( bundle.data || {} ) : this.fields;
		bundle = this.hydrate( bundle );
		bundle.object = bundle.object || ( typeof Tpl === 'function' ? new Tpl({}) : Object.create( Tpl ) );

		async.forEachOf( flds, function(value, fieldname, cb ){
			var methodname
			  , method
			  , attr
			  , field
			  ;

			field = this.fields[ fieldname ];

			if( field.options.readonly ){
				return cb && cb( );
			}

			methodname = `hydrate_${fieldname}`;
			method = this[ methodname ];

			if( isFunction( method ) ){
				bundle = method( bundle );
			}

			attr = field.options.attribute;

			if( attr ){
				field.hydrate( bundle, function( err, value ){
					if( err ){
						return cb( err );
					}
					if( field.is_related ){
						promises.push( [ attr, value ] );
					} else {
						set( bundle.object, attr, value );
					}
					cb();
				});
			} else {
				return cb && cb( null );
			}
		}.bind( this ), function( err ){
			
			if( err ){
				return done( err );
			}
			let promise = bundle.object.isSaved() ? Promise.resolve( bundle.object ) : bundle.object.save();
			promise.then(function( object ){
				bundle.object = object;
				promises  = collect( promises, function( iter ){
					bundle.object.removeRelation( iter[0] );
					set( bundle.object, iter[0], iter[1] );
					if( Array.isArray( iter[1]) ){
						return iter[1].map((model)=>{
							return bundle.object.addRelation(iter[0], model );
						});
					}
					
					return iter[1] && [ bundle.object.addRelation( iter[0], iter[1] ) ];
				});

				Promise
					.all( promises )
					.then(() => {
						done( err, bundle );
					})
					.catch(done);
			});
		});
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, replace_object: function( bundle, callback ){
		var that = this
	  	  , Model = this.options.queryset._model
		  , pk
	  	  ;

		pk = bundle.req.params.pk;
		bundle.object = new this.options.objectTpl({
			[this.options.pk]:pk
		});
		bundle.object.setSaved();
		that.full_hydrate( bundle, function( err, bndl ){
			Model.get( pk )
				.replace( bndl.object )
				.run(function( err ){
					return callback && callback( err, bndl );
				});	
		});
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, buildFilters: function buildFilters( qs ){
		var remaining = null
		  , filters = this.options.filtering || {}
		  , fieldmap = this.fields
		  , r = this.options.queryset._r
		  ;

		for( var key in qs ){
			let bits = key.split(  SEP  )
 			  , filtername = 'exact'
 			  , current
 			  , filter
 			  , fieldname
 			  , filtertype
 			  , attr
 			  ;

			fieldname  = bits.shift();
			filtername = bits[ bits.length - 1 ] || filtername;
			current    = filters[ fieldname ] || EMPTY_ARRAY
			filtertype = terms[ filtername ] ? terms[bits.pop()] : filtername;
			// exact isn't really a filter...
			if( current === constants.ALL || !fieldmap[fieldname] ) {
				// pass
			} else if( !current ){
				throw Boom.create(400, `filtering on ${fieldname} is not allowed`);
			} else if( ( current || []).indexOf( filtername ) === -1 ){
				throw Boom.create(400, `${filtername} filter is not allowed on field ${fieldname}` );
			}

			// should be defined on resource instance
			attr      = fieldmap[ fieldname ] ? fieldmap[fieldname].options.attribute || fieldname : fieldname;
			if( this.allowablepaths.indexOf( fieldname ) >=0 ){
				fieldname = bits.unshift( attr ) && bits.join( SEP );
				filter = filtertype( r, fieldname, typecast( qs[key] )  );
				remaining = remaining ? remaining.and( filter ) : filter;
			}
		}
		return remaining || EMPTY_OBJECT;
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, offset: function offset( query, bundle ){
		return query.skip( ~~(bundle.req.query.offset || 0 ));
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, limit: function offset( query, bundle ){
		var qs = bundle.req.query
		  , lmt
		  ;

		qs.limit = qs.hasOwnProperty( 'limit' )  ? parseInt( qs.limit, 10) : qs.limit;
		lmt = isNumber( qs.limit ) ? qs.limit ? qs.limit : this.options.max : this.options.limit ? this.options.limit : 25;
		lmt = Math.min( lmt, this.options.max );
		return query.limit( lmt );
	}

	/**
	 * DESCRIPTION
	 * @method index.js#<METHODNAME>
	 * @param {TYPE} NAME DESCRIPTION
	 * @param {TYPE} NAME DESCRIPTION
	 * @return {TYPE} DESCRIPTION
	 **/
	, sort: function offset( mquery, rquery ){
		var r, allowed, that;
		r       = this.options.queryset._r;
		allowed = this.options.ordering || [];
		that    = this;
		for( let param of toArray( rquery.orderby ) ){
			var bits = orderExp.exec( param )
			  , dir
			  ;

			if( !bits ){
				return;
			}else if( ~~bits[2] === 1 || allowed.indexOf( bits[2] ) === -1 ){
				return that.emit('error', Boom.create(400, "Invalid sort parameter: " + bits[2]) );
			}
	
			dir = bits[1] ? 'desc':'asc';
			debug('ordering %s - %s', bits[2], dir );
			mquery = mquery.orderBy( r[ dir ]( bits[2] ) );
		};
		return mquery;
	}
});

RethinkResource.extend = function( proto ){
	proto.inherits = RethinkResource;
	return new Class( proto );
};

RethinkResource.filter = overload(function( name, fn ){
	Object.defineProperty(terms, name, {
		writable: false
		,value: fn
	});
});
