/*jshint laxcomma: true, esnext: true, smarttabs: true, node:true, mocha: true*/
'use strict';
var fs   = require('fs')
  , path = require('path')
  , User = require('./data/model')
  , hapi = require('hapi')
  , tastypie = require('tastypie')
  , Resource = require('../lib/resource')
  , toArray = require("mout/lang/toArray")
  ;

function rand( max ){
	return Math.floor( Math.random() * (max || 96 + 1) - 0 );
}

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
		var users = fs.readFileSync( path.resolve( __dirname, 'data', 'test.json' ) );
		var companies = fs.readFileSync( path.resolve( __dirname, 'data', 'company.json' ) );
		var tags = fs.readFileSync( path.resolve( __dirname, 'data', 'tags.json' ) );

		Promise.all([
			User.Tag.delete(),
			User.Company.delete(),
			User.delete()
		])
		.then( function(){
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
					.then( () => done() )
					.catch( done );
				});
		})
		.catch(function(){done});
	});

	after(function(done){
		done()
	});

	describe('relations', function(){

		before(function( done ){
			let api = new tastypie.Api('api/v1');
			api.use('user', new UserResource());
			api.use('company', new CompanyResource());
			api.use('tag', new TagResource());
			server.register( [ api ], done );
		});


		describe('Has One', function(){
			let company;

			beforeEach(function( done ){
				server.inject({
					method:'get'
					,url:'/api/v1/company'
					,query:{
						limit:1
					}
					,headers:{
						Accept:'application/json'
					}
				},function( response ){
					let result = JSON.parse( response.result )
					company = result.data[rand( result.data.length )];
					done();
				});
			});

			it('should create a relation via URI', function(done){
				let payload = {
					company: company.uri
				  , name       : "Joe Blow"
				  , age        : 32
				  , eyes       : "brown"
				  , tags       : null
				  , registered : new Date()
				  , email      : "joeblow@gmail.com"
				  , latitude   : 1.0
				  , longitude  : 1.0
				  , range      : [ 2, 3 ]
				  , greeting   : "I'm Joe Blow"
				  , fruit      : "grape"
				};

				server.inject({
					method:'post'
					,url:'/api/v1/user'
					,payload:payload
					,headers:{
						'Content-Type':'application/json'
						,Accept:'application/json'
					}
				}, function( response ){
					User.Company.get( company.id )
						.then( ( c )=>{
							console.log( c )
						})
						.finally( done )
				});
			});

			it('should create a relation via new object', function(){});
			it('should create a relation via existing object', function(){});
		});

		describe('Has Many', function(){
			it('should create a relation via URI', function(){});
			it('should create a relation via new object', function(){});
			it('should create a relation via existing object', function(){});
		});
	});
	
});