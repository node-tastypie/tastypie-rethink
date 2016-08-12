'use strict';
/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true, esnext: true*/
var should          = require('should')
  , reqlite         = require('reqlite')
  , assert          = require('assert')
  , hapi            = require('hapi')
  , Api             = require('tastypie/lib/api')
  , lowerCase       = require('mout/string/lowerCase')
  , Resource        = require( 'tastypie/lib/resource' )
  , RethinkResource = require( '../lib/resource' )
  , clone           = require('mout/lang/clone')
  , fs              = require('fs')
  , path            = require('path')
  , util            = require('util')
  , fields          = require('tastypie/lib/fields')
  , http            = require('tastypie/lib/http')
  , toArray         = require('mout/lang/toArray')
  , tastypie = require('tastypie')
  , server
  , Model
  , connection
  ;

try{
	connection    = new reqlite({debug:!!process.env.REQL_DEBUG});
} catch( e ){
	console.log('reqlite connection failed');
}

function rand(){ return Math.floor( Math.random() * (96 + 1) - 0 );}

Model         = require('./data/model');

const CompanyResource = RethinkResource.extend({
	options:{
		name:'company',
		queryset:Model.Company.filter({})
	}
	,fields:{
		name:{type:'char'}
	}
});

const TagResource = RethinkResource.extend({
	options:{
		name:'tags',
		pk:'name',
		queryset:Model.Tag.filter({})
	}
});

var queryset, Rethink;
	queryset = Model.getJoin().filter({});

	Rethink = RethinkResource.extend({
		options:{
			queryset: queryset
			,allow:{
				list:{ get:true, put:true, post: true, delete: false }
			}
			,filtering:{
				name:tastypie.ALL,
				age:['lt', 'lte'],
				company:tastypie.ALL
			}
		}
		,fields:{
			name       : { type:'char', attribute:'name'}
		  , age        : { type:'int', required:true}
		  , eyes       : { type:'char', attribute:'eyeColor'}
		  , tags       : { type:'hasmany', to:TagResource, nullable: true, default: function(){ return [] } }
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

describe('RethinkResource', function( ){
	var server;
	var api = new Api('api/rethink');
	var server = new hapi.Server({minimal:true});
	var users = require('./data/test.json').slice();
	var tags  = require('./data/tags').slice();
	var companies = require('./data/company');

	server.connection({host:'localhost'});
	api.use(new TagResource);
	api.use(new CompanyResource);
	api.use('test', new Rethink );
	before(function( done ){
		server = new hapi.Server();
		server.connection({host:'localhost'});
		let seen = {};

		Promise.all([
			Model.Tag.delete(),
			Model.Company.delete(),
			Model.Address.delete(),
			Model.delete()
		])
		.then(function(){
			Model
				.insert( users )
				.then(function(response){

					tags = tags
							.map(function(tag){
								tag.user_id = response.generated_keys[rand()];
								return tag;
							});

					companies = companies.map( function( company ){
						company.user_id = response.generated_keys.pop();
						return company;
					});
					Promise.all([
						Model.update(function( user ){
							return { registered: Model.r.ISO8601(user('registered') ) }; 
						}),
						Model.Tag.insert( tags ),
						Model.Company.insert( companies )
					])
					.then(function(){
							server.register([api], function(err){
								done(err);
							});
						})
					.catch( done );
				});
		})
		.catch(function(){done});
	});

    describe('#full_hydrate', function(){
		it('should accurately parse data', function(done){
			var data = require('./data/test.json');
	    	delete data[0].id;

			server.inject({
				method:'post'
				,url:'/api/rethink/test'
				,headers:{
					'Accept':'application/json',
					'Content-Type':'application/json'
				}
				,payload:data[0]
			},function( response ){
				response.statusCode.should.equal( 201 );
				var result = JSON.parse( response.result );
				result.id.should.be.a.String();
				result.tags.should.be.a.Array();
				result.tags.should.be.a.Array();
				done()
			});
		});
	});

	describe('limiting', function(){
	
		it('should respect the limit param', function( done ){
			server.inject({
				url:'/api/rethink/test?limit=10'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var data = JSON.parse( response.result );
				data.data.length.should.equal( 10 );
				done();
			});
		});

		it('should no page with a limit of 0', function( done ){
			server.inject({
				url:'/api/rethink/test?limit=0'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var data = JSON.parse( response.result );
				data.data.length.should.be.greaterThan( 90 );
				done();
			});
		});
	});

	describe('filtering', function( ){

		it('should respect filtering definition', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__lt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				response.statusCode.should.equal(200);
				var content = JSON.parse( response.result );
				content.data.length.should.be.greaterThan( 0 );
				content.data.length.should.be.lessThan( 101 );
				done();
			});
		});

		it('should return  filters', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__gt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				assert.equal(response.statusCode, 400, "resource should only allow filtering on specified fields");
				done();
			});
		});

		
		it('should allow for nested look-ups',function( done ){
			server.inject({
				url:'/api/rethink/test?company__name__istartswith=c'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var content = JSON.parse( response.result);

				assert.equal(response.statusCode, 200 );
				content.data.length.should.be.greaterThan( 0 );
				content.data.forEach(function(item){
					if( item.company ){
						item.company.name.charAt(0).toLowerCase().should.equal('c');
					}
				});
				
				done();
			});

		});

	});

	describe('~Default Behaviors', function(){
		var ListResource, payload, user_id;

		payload = {
			"index": 100,
			"guid": "6951244a-bd3c-4c90-b6e0-e4213faf59d3",
			"isActive": true,
			"balance": "$1,276.84",
			"picture": "http://placehold.it/32x32",
			"age": 33,
			"eyes": "blue",
			"name": "Joe Schmoe",
			"email": "joeschmoe@rodemco.co.uk",
			"phone": "+1 (868) 410-3389",
			"address": "123 Main Street",
			"about": "Hello World",
			"registered": "2015-01-27T06:00:46.422Z",
			"latitude": "-51.074223",
			"longitude": "41.070667",
			"range": [
			  0,
			  1,
			  2,
			  9
			],
			"greeting": "Hello, undefined! You have 8 unread messages.",
			"fruit": "banana"
		};

		describe('#POST list', function(){
			var _data = clone( payload );
			_data.age = undefined;
			it('should reject partial data', function( done ){
				server.inject({
					url:'/api/rethink/test'
					,method:'post'
					,payload: _data
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
				}, function( response ){
					assert.equal( response.statusCode, 400 );
					done();
				});
			});

			it('should generate a new object', function( done ){
				server.inject({
					url:'/api/rethink/test'
					,method:'post'
					,payload: payload
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
				}, function( response ){
					assert.equal( response.statusCode, 201 );
					var res = JSON.parse( response.result );
					user_id = res.id;
					assert.ok( res.id );
					Model.get( user_id )
						 .then(function( user ){
						 	assert.equal( user.favoriteFruit, payload.fruit );
							done();
						 });
				});
			});
		});

		describe('#OPTIONS list', function(){

			it('should set the allow header of allowable methods', function( done ){
				server.inject({
					url:'/api/rethink/test'
					,method:'options'
					,headers:{
						Accept:'application/json'
					}
				},function( response ){
					let allowed = response
									.headers
									.allow
									.split(',')
									.map(lowerCase);

					allowed.indexOf('get').should.not.equal(-1);
					allowed.indexOf('put').should.not.equal(-1);
					allowed.indexOf('post').should.not.equal(-1);
					allowed.indexOf('delete').should.not.equal(-1);
					allowed.indexOf('options').should.not.equal(-1);
					done();
				});
			});
		});
		describe('#OPTIONS detail', function(){
			it('should set the allow header of allowable methods', function( done ){
				server.inject({
					url:'/api/rethink/test/1'
					,method:'options'
					,headers:{
						Accept:'application/json',
						'Content-Type':'application/json'
					}
				},function(response){
					let allowed = response
									.headers
									.allow
									.split(',')
									.map(lowerCase);

					allowed.indexOf('get').should.not.equal(-1);
					allowed.indexOf('put').should.not.equal(-1);
					allowed.indexOf('post').should.not.equal(-1);
					allowed.indexOf('delete').should.not.equal(-1);
					allowed.indexOf('options').should.not.equal(-1);
					done();
				});
			});
		});

		describe('#PATCH detail', function(){
			it('should allow partial updates with PATCH', function( done ){

				let payload = {name:'abacadaba',age:50};

				Model.filter(function( user ){
					return user('age').lt(50);
				})
				.nth( 0 )
				.then(function( user ){
					server.inject({
						url:`/api/rethink/test/${user.id}`
						,method:'patch'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
						,payload:payload
					},function( response ){
						assert.equal( response.statusCode, 200 );
						var res = JSON.parse( response.result );
						assert.equal( res.name, payload.name );
						done();
					});
				});
			});
		});
		describe('#GET detail', function(){
			it('should return a 404 for incorrect ids', function( done ){
				server.inject({
					url:'/api/rethikn/test/5'
					,method:'get'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
				},function( response ){
					assert.equal( response.statusCode, 404 );
					done();
				});
			});

			it('should return the requested object by id', function( done ){
				server.inject({
					url:`/api/rethink/test/${user_id}`
					,method:'get'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
				},function( response ){
					assert.equal( response.statusCode, 200 );
					let res = JSON.parse(response.result);
					assert.equal( res.id, user_id);
					done();
				});
			});
		});
		describe('#PUT detail', function(){

			it('should allow for full replacement with PUT', function( done ){
				payload.isActive = false;
				payload.fruit = 'apple';
			 	var uri =  `/api/rethink/test/${user_id}`
				payload.tags = [
					`/api/rethink/tags/${tags[0].name}`,
					`/api/rethink/tags/${tags[1].name}`
				];
				server.inject({
					url: uri 
					,method:'put'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
					,payload: payload
				}, function( response ){
					assert.equal( response.statusCode, 200 );
					var res = JSON.parse( response.result );
					res.tags.length.should.equal( 2 )
					assert.ok( ( new RegExp(tags[0].name)).test(res.tags[0]) );
					assert.ok( ( new RegExp(tags[1].name)).test(res.tags[1]) );
					assert.equal( res.fruit, payload.fruit );
					done( );
				});
			});

			it('should reject partial updates with PUT', function( done ){
				server.inject({
					url:`/api/rethink/test/${user_id}`
					,method:'put'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
					,payload:{name:'joe blow'}
				},function( response ){
					assert.equal( response.statusCode, 400);
					done();
				});
			});
		});
		describe('#DELETE detail', function(){
			it('should remove document and relations', function( done ){
				server.inject({
					url:`/api/rethink/test/${user_id}`
					,method:'delete'
				}, function(response){
					assert.equal( response.statusCode, 200 );
					var res = JSON.parse( response.result );
					Model.Tag.getAll( tags[0].name, tags[1].name )
						.then(function( data ){
							data.forEach(( tag )=>{
								assert.equal( tag.user_id, null );
							})
							done();
						})
						.catch( done );
				})
			})
		});
	})
});
