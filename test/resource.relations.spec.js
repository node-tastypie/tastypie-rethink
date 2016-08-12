/*jshint laxcomma: true, esnext: true, smarttabs: true, node:true, mocha: true*/
'use strict';
var fs   = require('fs')
  , path = require('path')
  , util = require('util')
  , should = require("should")
  , assert = require('assert')
  , User = require('./data/model')
  , hapi = require('hapi')
  , tastypie = require('tastypie')
  , Resource = require('../lib/resource')
  , toArray = require("mout/lang/toArray")
  ;


function rand( max ){
	return Math.floor( Math.random() * (max || 96 + 1) - 0 );
}

const ShoeResource = Resource.extend({
	options:{
		name:'shoe'
		,pk:'shoe_id'
		,labelField:'brand'
		,queryset:User.Shoe.filter({})
	}

	,fields:{
		brand:{ type:'char', nullable: false}
		,size:{ type:'int', default:2 }
		,color:{ type:'char', blank: false, nullable: false }
	    ,display: { type:'char', readonly: true }
	}

	,dehydrate_display: function( obj, bundle, result ){
		return `${obj.brand} ( ${obj.color} )`
	}
})

const SubSubResource = tastypie.Resource.extend({
	options:{
		name:'supernested',
		includeUri: false
	}

	,fields:{
		four:{type:'char', default:'four'}
		,five:{type:'char', default:'five'}
	}	
	,constructor: function( options ){
		this.parent('constructor', options )
	}
})

const SubResource = tastypie.Resource.extend({
	options:{
		name:'nested',
		includeUri:false
	}

	,fields:{
		one:{type:'int', default:0}
		,two:{type:'int', default:0}
		,three:{ type:'document', to:SubSubResource }
	}
	,constructor: function( options ){
		this.parent('constructor', options )
	}
});

const AddressResource = Resource.extend({
    options:{
        name:'company',
        queryset: User.Address.filter({})
    }

    ,fields:{
        state: { type: 'char'},
        city: { type: 'char'},
        street: { type: 'char'},
        country: { type: 'char'}
    }
    ,constructor: function( options ){
        this.parent('constructor')
    }
});
const CompanyResource = Resource.extend({
	options:{
		name:'company',
		queryset:User.Company.filter({})
	}
	,fields:{
		name:{type:'char'},
        address:{ type:'hasone', to: AddressResource }
	}
	,constructor: function( options ){
		this.parent('constructor', options )
	}
});

const PostResource = Resource.extend({
    options:{
        name:'post'
        ,pk:'post_id'
        ,queryset:User.Post.filter({})
    }

    ,fields:{
        title:{type:'char', required:true}
    }
    ,constructor: function( options ){
    	this.parent('constructor', options )
    }
})

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
	  , tags       : { type:'hasmany', to:TagResource, nullable: true, default: function(){ return [] } }
	  , company    : { type:'hasone', to:CompanyResource, nullable: false, full: true }
	  , registered : { type:'datetime'}
	  , email      : { type:'char', nullable: true}
	  , latitude   : { type:"float"}
	  , longitude  : { type:"float"}
	  , range      : { type:'array'}
	  , greeting   : { type:'char'}
      , posts      : { type:'hasmany', to: PostResource, nullable: false, full: true, default: function(){ return [] } }
	  , fruit      : { type:'char', attribute:'favoriteFruit'}
	  , shoes      : { type: 'hasmany', to: ShoeResource, nullable: true, minimal: true }
	  , nested     : { type: 'document', to: SubResource }
	}
});
describe('Related Resource', function( ){
	const server = new hapi.Server();
	server.connection({host:'localhost'});
	var users, companies, tags, address;
	before(function(done){
		users = JSON.parse( fs.readFileSync( path.resolve( __dirname, 'data', 'test.json' ) ) );
		companies = fs.readFileSync( path.resolve( __dirname, 'data', 'company.json' ) );
		tags = fs.readFileSync( path.resolve( __dirname, 'data', 'tags.json' ) );
		address = fs.readFileSync( path.resolve( __dirname, 'data', 'address.json' ) );

		Promise.all([
			User.Tag.delete(),
			User.Address.delete(),
			User.Company.delete(),
			User.delete()
		])
		.then( function(){
			User
				.insert( users )
				.then(function(response){

					tags = JSON.parse( tags )
							.map(function(tag){
								tag.user_id = response.generated_keys[rand()];
								return tag;
							});

					address = JSON.parse( address )

					companies = JSON.parse( companies ).map( function( company ){
						company.user_id = response.generated_keys.pop();
						return company;
					});

					Promise.all([
						User.Tag.insert( tags, {durability: 'soft'}),
						User.Company.save( companies ,{durability:'soft'}),
						User.Address.save( address, {durability:'soft'})
					])
					.then( (results) => {
						Promise.all(results[1].map( ( company )=>{ return company.addRelation( 'address', results[2].pop() ) } ))
							.then( ()=> done() )
					} )
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
					User.Company
						.get(company.id)
						.getJoin({address: true})
						.then( ( c )=>{
							c.id.should.equal( company.id );
							assert.ok( c.name )
							assert.ok( c.address )
							assert.ok( c.address.city )
						})
						.finally( done )
				});
			});
			it('should create a relation via new object', function(done){
				let payload = {
					company:{
						address: {
							"city":  "Mountain View" ,
							"country":  "USA" ,
							"state":  "Californial" ,
							"street":  "Google Rd"
						},
						name:"Google"
					}
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
				}


				server.inject({
					method:'post'
					,url:'/api/v1/user'
					,payload:payload
					,headers:{
						'Content-Type':'application/json'
						,Accept:'application/json'
					}
				}, function( response ){
					let res = JSON.parse( response.result )
					response.statusCode.should.equal( 201 );
					res.company.name.should.equal( 'Google' )
					res.company.uri.should.equal( `/api/v1/company/${res.company.id}`)
					done();
				});
			});
			it('should create a relation via existing object', function(){});
		});

		describe('Has Many', function(){
			it('should create a relation via URI', function(done){
				let payload = {
					company:{
						address: {
							"city":  "Mountain View" ,
							"country":  "USA" ,
							"state":  "Californial" ,
							"street":  "Google Rd"
						},
						name:"Google"
					}
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
				}
				payload.tags = [
					`/api/v1/tag/${tags[0].name}`,
					`/api/v1/tag/${tags[1].name}`
				];
				server.inject({
					url: "/api/v1/user" 
					,method:'post'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
					,payload: payload
				}, function( response ){
					assert.equal( response.statusCode, 201 );
					var res = JSON.parse( response.result );
					res.tags.length.should.equal( 2 )
					assert.equal(res.nested.one, 0)
					assert.equal(res.nested.two, 0)
					assert.equal(res.nested.three.four, 'four')
					assert.equal(res.nested.three.five, 'five')
					assert.equal( res.fruit, payload.fruit );
					done( );
				});
			});
			it('should create a relation via new object', function(done){
				let payload = {
					company:null
					, name       : "Joe Schmoe"
					, age        : 45
					, eyes       : "brown"
					, tags       : null
					, registered : new Date()
					, email      : "joebschmoe@gmail.com"
					, latitude   : 2.0
					, longitude  : 2.0
					, range      : [ 4, 5 ]
					, greeting   : "I'm Joe Schmoe"
					, fruit      : "blueberry"
				}
				payload.posts = [{
                    title:'A Blog Post'
                }];

				server.inject({
					url: "/api/v1/user" 
					,method:'post'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
					,payload: payload
				}, function( response ){
					assert.equal( response.statusCode, 201 );
					var res = JSON.parse( response.result );
					res.posts.length.should.equal( 1 )
					assert.ok( res.posts[0].id )
					assert.ok( res.id )
                    assert.equal( res.fruit, payload.fruit );
					done( );
				});
 
            });
			it('should create a relation via existing object', function( done ){
				let payload = {
					company:null
					, name       : "billy Bob"
					, age        : 21
					, eyes       : "blue"
					, tags       : null
					, registered : new Date()
					, email      : "billybob@gmail.com"
					, latitude   : 3.0
					, longitude  : 4.0
					, range      : [ 4, 5 , 10]
					, greeting   : "I'm Billy Bob"
					, fruit      : "banana"
				}
                new User.Post({title:'This is blog 2'})
                        .save()
                        .then( function( post ){
                            payload.posts = [ post ]            
                            server.inject({
                                url: "/api/v1/user" 
                                ,method:'post'
                                ,headers:{
                                    Accept:'application/json'
                                    ,'Content-Type':'application/json'
                                }
                                ,payload: payload
                            }, function( response ){
                                assert.equal( response.statusCode, 201 );
                                var res = JSON.parse( response.result );
                                res.posts.length.should.equal( 1 )
                                assert.ok( res.posts[0].id )
                                assert.ok( res.id )
                                assert.equal( res.fruit, payload.fruit );
                                done( );
                            });
                        })                
            });
		});
		describe('Has Many - m2m', function(){
			it("should allow creation via new objects", function( done ){
				let payload = {
					company:{
						name:'Shoe Company'
						,address:{
							state:'New York'
							,city:'New York'
							,street:'123 Broadway st.'
							,country: 'USA'
						}
					}
					, name       : "Johnny twoshoes"
					, age        : 22
					, eyes       : "blue"
					, tags       : null
					, registered : new Date()
					, email      : "johnnytwoschoes@gmail.com"
					, latitude   : 4
					, longitude  : 4
					, range      : [ 11, 20 ]
					, greeting   : "I'm Johnny Twoshoes"
					, fruit      : "grape"
					, nested   : {
						two: 100
					}
				}
				payload.shoes = [{
                    brand:'nike',
					color:'blue',
					size:10
                },{
					brand:'puma',
					color:'grey',
					size: 11
				}];

				server.inject({
					url: "/api/v1/user" 
					,method:'post'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
					,payload: payload
				}, function( response ){
					var res = JSON.parse( response.result );
					assert.equal( response.statusCode, 201 );
					res.shoes.length.should.equal( 2 )
					assert.ok( res.shoes[0].id )
					assert.ok( res.id )
                    assert.equal( res.fruit, payload.fruit );
					assert.equal(res.nested.one, 0)
					assert.equal(res.nested.two, 100)
					assert.equal(res.nested.three.four, 'four')
					assert.equal(res.nested.three.five, 'five')
					assert.equal( res.fruit, payload.fruit );
					done( );
				});
 
				
			})
		});
	});
	
});
