/*jshint node:true, mocha: true, laxcomma: true, esnext:true*/
'strict mode';
var assert      = require('assert')
  , should      = require('should')
  , path        = require('path')
  , os          = require('os')
  , util        = require('util')
  , filters     = require('../lib/resource/filters')
  , hapi          = require('hapi')
  , Api           = require('tastypie/lib/api')
  , RethinkResource = require( '../lib/resource' )
  , fs            = require('fs')
  , Model         = require('./data/model')
  , path          = require('path')
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
  ;

describe('rethink', function(){

	before(function( done ){
		var data = require('./data/test.json');
		Model.insert(data).then(function( records ){
			done();
		})
	});

	after(function( done ){
		done();
	});


	describe('filters', function(){
		describe('gt', function(){
			it('should return data greater than the specified values', function( done ){

				Model.filter( filters.gt(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.be.above( 30 );
							d.age.should.not.be.below( 30 );
						});
						
						done();

					})
					.catch( done )
			});

			it('should not return data less than the specified values', function( done ){
				Model.filter( filters.gt(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.not.be.below( 30 );
							d.age.should.be.above( 30 );
						});
						done();

					})
					.catch( done )
			});


		});
		describe('gte', function(){
			it('should return data greater than or equal to the specified values', function( done ){
				Model.filter( filters.gte(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.be.aboveOrEqual( 30 );
							d.age.should.not.be.below( 30 );
						});
						
						done();

					})
					.catch( done )
			});
		});
		describe('lt', function(){
			it('should return data less than the specified values', function( done ){
				Model.filter( filters.lt(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.be.below( 30 );
						});
						done();

					})
					.catch( done )
			});

			it('should not return data greater than the specified values', function( done ){
				Model.filter( filters.lt(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.not.be.above( 30 );
						});
						done();

					})
					.catch( done )
			});
		});
		describe('lte', function(){
			it('should return data less than or equal to the specified values', function( done ){
				Model.filter( filters.lte(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.be.belowOrEqual( 30 );
						});
						done();

					})
					.catch( done )
			});

			it('should not return data greater than or equal to the specified values', function( done ){
				Model.filter( filters.lte(Model.r, 'age', 30 ) )
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.age.should.not.be.above( 30 );
						});
						done();

					})
					.catch( done )
			});
		});
		describe('isnull', function(){
			describe('is true', function(){
				it.skip('should only return values where then value is null', function(done){
					Movement.collection().query(function( qb ){
						qb = filters.isnull(qb, 'issue', true );
						qb = qb.limit(10)
						  .then( function( data ){
						  	data.forEach( function( d ){
						  		should.equal(d.issue, null);
						  	});
						  	done();
						  });
					});
				});
			});

			describe('is false', function(){
				it.skip('should only return value that are not null', function( done ){
					Movement.collection().query(function( qb ){
						qb = filters.isnull(qb, 'issue', false );
						qb = qb.limit(10)
						  .then( function( data ){
						  	data.forEach( function( d ){
						  		should.equal( d.issue );
						  	});
						  	done();
						  });
					});
				});
			});
		});

		describe('contains', function(){
			it('should match values any where in a string in a case sensitive manner', function( done ){
				Model.filter( filters.contains(Model.r, 'name', 'ly' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match( /ly/g );
							d.name.should.not.match( /LY/g );
						});
						done();

					})
					.catch( done )
			});
		});
		
		describe('icontains', function(){
			it('should match values any where in a string in a case insensitive manner', function( done ){
				Model.filter( filters.icontains(Model.r, 'address', 'brown' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.address.should.match(/brown/gi);
							d.address.should.match(/BROWN/gi);
							d.address.should.not.match(/abacadaba/);
						});
						done();

					})
					.catch( done )
			});
		});

		describe('startswith', function(){
			it('should match values at the beginning of a string in a case sensitive manner', function( done ){
				Model.filter( filters.startswith(Model.r, 'gender', 'fem' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.gender.should.match(/^fem/);
							d.gender.should.not.match(/^Fem/);
						});
						done();

					})
					.catch( done )
			});
			it('should not match values at the end of a string in a case sensitive manner', function( done ){
				Model.filter( filters.startswith(Model.r, 'gender', 'fem' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.gender.should.not.match(/fem$/);
						});
						done();

					})
					.catch( done )
			});
		});

		describe('istartswith', function(){
			it('should match values that startwith a string in a case sensitive manner', function( done ){
				Model.filter( filters.istartswith(Model.r, 'gender', 'FEM' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.gender.should.match(/^fem/);
						});
						done();

					})
					.catch( done )
			});
		});
		describe('endswith', function(){
			it('should match values that endswith a string in a case sensitive manner', function( done ){
				Model.filter( filters.endswith(Model.r, 'name', 'Zimmerman' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match(/Zimmerman$/);
							d.name.should.not.match(/zimmerman$/);
						});
						done();

					})
					.catch( done )
			});
		});
		describe('iendswith', function(){
			it('should match values that endswith a string in a case insensitive manner', function( done ){
				Model.filter( filters.iendswith(Model.r, 'name', 'ZIMMERMAN' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match(/Zimmerman$/i);
						});
						done();

					})
					.catch( done )
			});

		});
		describe('range', function(){
			it.skip('should should match dates between a given date range',function(done){
				
				Model.filter( filters.range(Model.r, 'registered', ['2015-08-01', '2015-09-01']) )
					.limit(10)
					.then( function( data ){
						var start, end;
						data.length.should.be.above( 0 );
						start = new Date(2015, 7, 1)
						end = new Date(2015, 8, 1)

						data.forEach(function( d ){
							d.registered.should.be.below( end )
							d.registered.should.be.above( start )
						});
						done();

					})
					.catch( done )
			});

			it.skip('should reject an invalid date range', function(done){
				var start, end;
				done()
			});
		});

		describe('ne', function(){
			it('should only include values not equal to a specified value', function( done ){
					Model.filter( filters.ne(Model.r, 'eyeColor', 'blue' ) )
						.limit(10)
						.then( function( data ){
							data.length.should.be.above( 0 );

							data.forEach(function( d ){
								d.eyeColor.should.not.equal('blue')
							});
							done();

						})
						.catch( done )
			});
		});

		describe('in', function(){
			it('should only include numeric values in a specified array', function( done ){
				var ids = [1,2,3,4,5,6,7,8];
				Model.filter( filters.in(Model.r, 'index', ids ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							ids.should.containEql(d.index)
						});
						done();
					})
					.catch( done )
			});

			it('should only include string values in a specified array', function( done ){
				var ids = ['brown','green'];
				Model.filter( filters.in(Model.r, 'eyeColor', ids ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							ids.should.containEql(d.eyeColor)
						});
						done();
					})
					.catch( done )
			});

			it('should only include string values in a specified string', function( done ){
				var ids = ['brown','green'];
				Model.filter( filters.in(Model.r, 'eyeColor', ids.join(',') ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							ids.should.containEql(d.eyeColor)
						});
						done();
					})
					.catch( done )
			});


		});
		describe('nin', function(){
			it('should exclude values not in a specified array', function( done ){
				var ids = [1,2,3,4,5,6,7,8];
				Model.filter( filters.nin(Model.r, 'index', ids ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							ids.should.not.containEql(d.index)
						});
						done();
					})
					.catch( done )
			})
		});
	});

});
