/*jshint laxcomma: true, smarttabs: true, node: true, unused: true */
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

var isNumber      = require('mout/lang/isNumber')
  , isString      = require('mout/lang/isString')
  , toArray       = require('mout/lang/toArray')
  , Boom          = require( 'boom' )
  , async         = require('async')
  , typecast      = require('mout/string/typecast')
  , Class         = require('tastypie/lib/class')
  , Options       = require('tastypie/lib/class/options')
  , Resource      = require('tastypie/lib/resource')
  , Paginator     = require('tastypie/lib/paginator')
  , http          = require('tastypie/lib/http')
  , constants     = require('tastypie/lib/constants')
  , debug         = require( 'debug' )('tastypie:resource:rethink')
  , SEP           = '__'
  , orderExp      = /^(\-)?([\w]+)/
  , RethinkResource
  , terms
  ;


function toField( r, field ){
	field = field.split( SEP );
	var ret = r.row( field.shift() );
	while( field.length ){
		ret = ret( field.shift() );
	}
	return ret;
}


terms = {
	'gt'            : { value: function( r, field, term ){ return toField(r, field).gt( term ); } }
	, 'gte'         : { value: function( r, field, term ){ return toField(r, field ).ge( term ); } }
	, 'lt'          : { value: function( r, field, term ){ return toField(r, field ).lt( term ); } }
	, 'lte'         : { value: function( r, field, term ){ return toField(r, field ).le( term ); } }
	, 'ne'          : { value: function( r, field, term ){ return toField(r, field ).ne( term ); } }
	, 'nin'         : { value: function( r, field, term ){ return terms.in( r, field, term ).not(); } }
	, 'size'        : { value: function( r, field, term ){ return toField(r, field ).count().eq( term ); } }
	, 'match'       : { value: function( r, field, term ){ return toField(r, field ).contains( term ); } }
	, 'exact'       : { value: function( r, field, term ){ return toField(r, field ).eq( term ); } } 
	, 'regex'       : { value: function( r, field, term ){ return toField(r, term ).match( term ); } }
	, 'iexact'      : { value: function( r, field, term ){ return toField(r, field ).match( "(?i)" + term); } }
	, 'contains'    : { value: function( r, field, term ){ return toField(r, field ).match( term ); } }
	, 'icontains'   : { value: function( r, field, term ){ return toField(r, field ).match( "(?i)" + term ); } }
	, 'startswith'  : { value: function( r, field, term ){ return toField(r, field ).match("^" + term ); } }
	, 'istartswith' : { value: function( r, field, term ){ return toField(r, field ).match( "(?i)^" + term ); } }
	, 'endswith'    : { value: function( r, field, term ){ return toField(r, field ).match( term + "$"); } }
	, 'iendswith'   : { value: function( r, field, term ){ return toField(r, field ).match("(?i)" + term + "$"); } }

	, 'in'          : { 
		value: function( r, field, term ){
			term = isString( term ) ? term.split(',') : term;
			var filter = r.row( field ).contains( term.shift() );
			while( term.length ){
				filter = filter.or( r.row( field ).contains( term.shift() ) );
			}
			return filter;
		}
	}
	, 'all'         : {
		value: function( r, field, term ){
			term = isString( term ) ? term.split(',') : term;
			var filter = r.row( field ).contains( term.shift() );
			while( term.length ){
				filter = filter.and( r.row( field ).contains( term.shift() ) );
			}
			return filter;
		}
	}
};

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
				that.options.cache.set(bundle.toKey( 'detail') , null );
				instance.delete().then(function(){
					return that.respond( bundle );
				});
			});
		});
	}


	, _post_list: function _post_list( bundle, callback ){
		var format = this.format( bundle, this.options.serializer.types )
		  , that = this
		  ;

		this.deserialize( bundle.data, format, function( err, data ){
			bundle = that.bundle(bundle.req, bundle.res, data );
			bundle.object = new that.options.queryset._model( data );
			that.full_hydrate( bundle, function( err, bndl ){
				bndl.object.saveAll( function( err ){
					return callback && callback( err, bndl );
				});
			});
		});
	}

	, get_object: function( bundle, callback ){
		var filter = {};
		filter[ this.options.pk ] = bundle.req.params.pk;

		this.options
			.queryset
			._model
			.filter( filter )
			.run( function( err, results ){
				return callback && callback( err, results[0]);
			} );

		filter = null;
		return this;
	}

	, update_object: function( bundle, callback ){
		debug('update_object');
		var format = this.format( bundle, this.options.serializer.types );
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

			this.deserialize( bundle.data, format, function( err, data ){
				bundle.data   = data;
				bundle.object = obj;
				that.full_hydrate( bundle, function( err, bndl ){
					bndl.object.saveAll(function(err){
						return callback && callback( err, bndl );
					});
				});
			});
		}.bind( this ) );
	}

	, replace_object: function( bundle, callback ){
		var that = this
		  , format = this.format( bundle, this.options.serializer.types )
	  	  , Model = this.options.queryset._model
	  	  ;
		
		this.deserialize( bundle.data, format, function( err, data ){
			var pk = bundle.req.params.pk;
			bundle = that.bundle( bundle.req, bundle.res, data );
			bundle.object = {id:pk};
			that.full_hydrate( bundle, function( err, bndl ){
				Model.get( pk )
					.replace( bndl.object )
					.run(function( err ){
						return callback && callback( err, bndl );
					});	
			});
		});
	}	
	, buildFilters: function buildFilters( qs ){
		var remaining = null
		  , filters = this.options.filtering || {}
		  , fieldmap = this.fields
		  , r = this.options.queryset._r
		  ;

		for( var key in qs ){
			var bits = key.split(  SEP  )
 			  , filtername = 'exact'
 			  , bitlength
 			  , value
 			  , filter
 			  , fieldname
 			  , filtertype
 			  , attr
 			  ;


			value      = qs[key];
			fieldname  = bits.shift();
			bitlength  = bits.length - 1;
			filtername = bits[ bitlength ] || filtername;
			filtertype = terms[ filtername ] ? terms[bits.pop()] : filtername;
			var e;
			// exact isn't really a filter...
			if( filters[fieldname] === constants.ALL || !fieldmap[fieldname] ) {
				// pass
			} else if( !filters[ fieldname ] ){
				e  = Boom.create(400, "filtering on " + fieldname + " is not allowed");
				throw e;
			} else if( ( filters[fieldname] || []).indexOf( filtername ) === -1 ){
				e   = Boom.create(400,filtername + " filter is not allowed on field " + fieldname );
				throw e;
			}

			// should be defined on resource instance
			attr      = fieldmap[ fieldname ] ? fieldmap[fieldname].options.attribute || fieldname : fieldname;
			if( this.allowablepaths.indexOf( fieldname ) >=0 ){
				fieldname = bits.unshift( attr ) && bits.join( SEP );
				filter = filtertype.value( r, fieldname, typecast( value )  );
				remaining = remaining ? remaining.and( filter ) : filter;
			}
		}
		return remaining || {};
	}

	, offset: function offset( query, bundle ){
		debug('offset', bundle.req.query.offset);
		return query.skip( ~~(bundle.req.query.offset || 0 ));
	}

	, limit: function offset( query, bundle ){
		var qs = bundle.req.query
		  , lmt
		  ;

		qs.limit = qs.hasOwnProperty( 'limit' )  ? parseInt( qs.limit, 10) : qs.limit;
		lmt = isNumber( qs.limit ) ? qs.limit ? qs.limit : this.options.max : this.options.limit ? this.options.limit : 25;
		lmt = Math.min( lmt, this.options.max );
		return query.limit( lmt );
	}

	, sort: function offset( mquery, rquery ){
		var r = this.options.queryset._r;
		var allowed = this.options.ordering || [];
		var that = this;
		toArray( rquery.orderby ).forEach( function( param ){
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
		});
		return mquery;
	}
});

RethinkResource.extend = function( proto ){
	proto.inherits = RethinkResource;
	return new Class( proto );
};
