/*jshint laxcomma: true, esnext: true, smarttabs: true, node:true, mocha: true*/
'use strict';
var fs   = require('fs')
  , path = require('path')
  , User = require('./data/model')
  , hapi = require('hapi')
  , tatsypie = require('tastypie')
  , Resource = require('../lib/resource')
  ;

const CompanyResource = Resource.extend({
	options:{
		name:'company',
		queryset:User.Company.filter({})
	}
	,fields:{
		name:{type:'char'}
	}
});

const TagResource = Resource.extend({
	options:{
		name:'tags',
		pk:'name',
		queryset:User.Tag.filter({})
	}
});

var queryset, UserResource;
	queryset = User.getJoin().filter({});

UserResource = Resource.extend({
	options:{
		queryset: queryset
	}
	,fields:{
		name       : { type:'char', attribute:'name'}
	  , age        : { type:'int', required:true}
	  , eyes       : { type:'char', attribute:'eyeColor'}
	  , tags       : { type:'hasmany', to:TagResource, nullable: true, default: toArray }
	  , company    : { type:'hasone', to:CompanyResource, nullable: true, full: true}
	  , registered : { type:'datetime'}
	  , email      : { type:'char', nullable: true}
	  , latitude   : { type:"float"}
	  , longitude  : { type:"float"}
	  , range      : { type:'array'}
	  , greeting   : { type:'char'}
	  , fruit      : { type:'char', attribute:'favoriteFruit'}
	}
});

describe('Related Resource', function( ){
	const server = new hapi.Server();
	server.connection({host:'localhost'});

	before(function(done){
		server = new Ha
		var users = fs.readFileSync( path.resolve( __dirname, '..', 'data', 'test.json' ) )
		var companies = fs.readFileSync( path.resolve( __dirname, '..', 'data', 'company.json' ) )
		var tags = fs.readFileSync( path.resolve( __dirname, '..', 'data', 'tags.json' ) )

		User
			.insert( JSON.parse(users) )
			.then(function(response){

				tags = JSON.parse( tags )
						.map(function(tag){
							tag.user_id = response.generated_keys[rand()];
							return tag;
						});

				companies = JSON.parse( companies ).map( function( company ){
					company.user_id = response.generated_keys.pop();
					return company;
				});

				Promise.all([
					User.Tag.insert( tags ),
					User.Company.insert( companies )
				])
				.then(function(){
						server.register([api], function(err){
							done(err);
						});
					})
				.catch( done );
			});
	});

	after(function(done){
		Promise.all([
			User.Tag.delete(),
			User.Company.delete(),
			User.delete()
		])
		.then( function(){
			done();
		})
		.catch(function(){done});
	});

	describe('relations', function(){

		before(function(){
			let api = new tastypie.Api('api/v1')

			server.register([api],done)
		});


		describe('Has One', function(){
			it('should create a relation via URI', function(){})
			it('should create a relation via new object', function(){})
			it('should create a relation via existing object', function(){})
		});
		describe('Has Many', function(){

		});
	});
	
});