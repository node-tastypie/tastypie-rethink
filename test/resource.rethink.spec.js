/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
var should        = require('should')
  , assert        = require('assert')
  , hapi          = require('hapi')
  , Api           = require('tastypie/lib/api')
  , Resource      = require( 'tastypie/lib/resource' )
  , RethinkResource = require( '../lib/resource' )
  , fs            = require('fs')
  , Model         = require('./data/model')
  , path          = require('path')
  , fields        = require('tastypie/lib/fields')
  , http          = require('tastypie/lib/http')
  , server
  ;


var queryset, Rethink;
	queryset = Model.filter({});

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
			tags: {type:'array'}
		}

		,full_hydrate:function( bundle, done ){
			this.parent('full_hydrate', bundle, function( err, bndl ){
				assert.equal( err, null );
				bundle.object.friends.should.be.a.Array()
				done( err, bndl )
			})
		}
	});

describe('RethinkResource', function( ){
	var server;
	var api = new Api('api/rethink')
	var server = new hapi.Server({minimal:true});
	server.connection({host:'localhost'})
	api.use('test', new Rethink );
	before(function( done ){
		server = new hapi.Server()
		server.connection({host:'localhost'});

		var data = require('./data/test.json');
		

		Model.insert(data).then(function( records ){
			server.register([api], function(err){
				done(err);
			});
		})
		.catch( done );
	});

	after(function( done ){
		Model.delete().then(function(){
			done()
		});
	});

    describe('#full_hydrate', function(){
		it('should accurately parse data', function(done){
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
