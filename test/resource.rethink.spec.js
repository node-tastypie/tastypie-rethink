'use strict';
/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
var should          = require('should')
  , reqlite         = require('reqlite')
  , assert          = require('assert')
  , hapi            = require('hapi')
  , Api             = require('tastypie/lib/api')
  , Resource        = require( 'tastypie/lib/resource' )
  , RethinkResource = require( '../lib/resource' )
  , clone           = require('mout/lang/clone')
  , fs              = require('fs')
  , path            = require('path')
  , fields          = require('tastypie/lib/fields')
  , http            = require('tastypie/lib/http')
  , server
  , Model
  , connection
  ;

try{
	connection    = new reqlite({debug:!!process.env.REQL_DEBUG})
} catch( e ){
	console.log('reqlite connection failed')
}

Model         = require('./data/model')
var queryset, Rethink;
	queryset = Model.getJoin().filter({});

	Rethink = RethinkResource.extend({
		options:{
			queryset: queryset
			,allow:{
				list:{get:true, put:true, post: true }
			}
			,filtering:{
				name:1,
				age:['lt', 'lte'],
				company:1
			}
		}
		,fields:{
			name:{type:'char', attribute:'name'},
			age:{type:'int'},
			eyes:{type:'char', attribute:'eyeColor'},
			company:{ type:'object' },
			tags: {type:'array'},
			registered:{type:'datetime'}
		}
	});

describe('RethinkResource', function( ){
	var server;
	var api = new Api('api/rethink')
	var server = new hapi.Server({minimal:true});
	var users = require('./data/test.json').slice()
	var tags  = require('./data/tags').slice()

	server.connection({host:'localhost'})
	api.use('test', new Rethink );
	before(function( done ){
		server = new hapi.Server()
		server.connection({host:'localhost'});
		let seen = {}
		function rand(){ return Math.floor( Math.random() * (users.length + 1) - 0 )}

		Model
			.insert( users )
			.then(function(response){
				tags = tags
						.filter(function(tag){
							let dup = !!seen[tag.name];

							seen[tag.name] = true;
							return dup;							
						})
						.map(function(tag){
							tag.user_id = response.generated_keys[rand()]
							return tag
						}).slice(0,users.length);
				Model.Tag
					.insert(tags)
					.then(function(){
						server.register([api], function(err){
							done(err);
						});
					})
					.catch( done )
			})
	});

	after(function( done ){
		Promise.all([
			Model.Tag.delete(),
			Model.delete()
		]).then( function(){done()})
		.catch(function(){done})
	});

    describe('#full_hydrate', function(){
		it.skip('should accurately parse data', function(done){
			var data = require('./data/test.json');
			server.inject({
				method:'post'
				,url:'/api/rethink/test'
				,headers:{
					'Accept':'application/json',
					'Content-Type':'application/json'
				}
				,payload:JSON.stringify(data[0])
			},function( response ){
				response.statusCode.should.equal( 201 )
				var result = JSON.parse( response.result );
				console.log( result )
				result.friends.should.be.a.Array();
				result.id.should.be.a.String();
				result.tags.should.be.a.Array();
				result.tags[0].should.be.a.String();
				result.tags[0].should.not.be.a.Number();
				Model.get( result.id )
					.then( function( instance ){
						instance.tags[0].should.be.a.String()	
						instance.tags[0].should.not.be.a.Number();
						done();
					})
			});
		})
	})
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
			})
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
			})
		});
	})

	describe('filtering', function( ){

		it('should respect filtering definition', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__lt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				response.statusCode.should.equal(200)
				var content = JSON.parse( response.result )
				content.data.length.should.be.greaterThan( 0 );
				content.data.length.should.be.lessThan( 101 );
				done();
			})
		})

		it('should return  filters', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__gt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				assert.equal(response.statusCode, 400, "resource should only allow filtering on specified fields")
				done()
			})
		});

		
		it('should allow for nested look-ups',function( done ){
			server.inject({
				url:'/api/rethink/test?company__name__istartswith=c'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var content = JSON.parse( response.result)
				assert.equal(response.statusCode, 200 );
				content.data.length.should.be.greaterThan( 0 )
				content.data.forEach(function(item){
					if( item.company ){
						item.company.name.charAt(0).toLowerCase().should.equal('c')
					}
				});
				
				done()
			})

		});

	});

})
