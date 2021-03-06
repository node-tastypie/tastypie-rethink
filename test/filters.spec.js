/*jshint node:true, mocha: true, laxcomma: true, esnext:true*/
'strict mode';
var assert      = require('assert')
  , should      = require('should')
  , path        = require('path')
  , os          = require('os')
  , fs          = require('fs')
  , util        = require('util')
  , filters     = require('../lib/resource/filters')
  , hapi          = require('hapi')
  , clone      = require('mout/lang/clone')
  , Api           = require('tastypie/lib/api')
  , RethinkResource = require( '../lib/resource' )
  , fs            = require('fs')
  , Model         = require('./data/model')
  , path          = require('path')
  , http          = require('tastypie/lib/http')
  , tastypie      = require('tastypie')
  , typeOf        = require('mout/lang/kindOf')
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
				name:tastypie.ALL,
				age:['lt', 'lte'],
				company:tastypie.ALL
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
		Model.delete()
			.then(function(){
				Model.save( JSON.parse( fs.readFileSync( path.resolve(__dirname,'./data/test.json') ) ) ).then(function( records ){
					done();
				})
			})
	});

	after(function( done ){
		Model.delete().then(( )=>{done()});
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
				it('should only return values where then value is null', function(done){
					Model.filter( filters.isnull( Model.r, 'email', true))
						.then(function( data ){
							data.length.should.be.above(0)
							data.forEach( function( d ){
								assert.strictEqual(d.email,null)
							})
							done();
						})
				});
			});

			describe('is false', function(){
				it('should only return value that are not null', function( done ){
					Model.filter( filters.isnull( Model.r, 'email', false))
						.then(function( data ){
							data.length.should.be.above(0)
							data.forEach( function( d ){
								d.email.should.not.be.Null();
							})
							done();
						})
				});
			});
		});

		describe('contains', function(){
			it('should match values any where in a string in a case sensitive manner', function( done ){
				Model.filter( filters.contains(Model.r, 'name', 'ie' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match( /ie/g );
							d.name.should.not.match( /IE/g );
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
				Model.filter( filters.startswith(Model.r, 'eyeColor', 'gre' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.eyeColor.should.match(/^gre/);
							d.eyeColor.should.not.match(/^Gre/);
						});
						done();

					})
					.catch( done )
			});
			it('should not match values at the end of a string in a case sensitive manner', function( done ){
				Model.filter( filters.startswith(Model.r, 'eyeColor', 'gre' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.eyeColor.should.not.match(/gre$/);
						});
						done();

					})
					.catch( done )
			});
		});

		describe('istartswith', function(){
			it('should match values that startwith a string in a case sensitive manner', function( done ){
				Model.filter( filters.istartswith(Model.r, 'eyeColor', 'GRE' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.eyeColor.should.match(/^gre/);
						});
						done();

					})
					.catch( done )
			});
		});
		describe('endswith', function(){
			it('should match values that endswith a string in a case sensitive manner', function( done ){
				Model.filter( filters.endswith(Model.r, 'name', 'Mathews' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match(/Mathews$/);
							d.name.should.not.match(/mathews$/);
						});
						done();

					})
					.catch( done )
			});
		});
		describe('iendswith', function(){
			it('should match values that endswith a string in a case insensitive manner', function( done ){
				Model.filter( filters.iendswith(Model.r, 'name', 'MATHEWS' ) )
					.limit(10)
					.then( function( data ){
						data.length.should.be.above( 0 );

						data.forEach(function( d ){
							d.name.should.match(/mathews$/i);
						});
						done();

					})
					.catch( done )
			});
		});
		describe('range', function(){
			it('should should match dates between a given date range',function(done){
				
				Model.filter( filters.range(Model.r, 'registered', ['2015-08-01', '2015-10-01']) )
					.limit(10)
					.then( function( data ){
						var start, end;
						data.length.should.be.above( 0 );

                        // JS dates are 0 index. Rethink is 1
						start = new Date(2015, 7, 1)
						end = new Date(2015, 9, 1)

						data.forEach(function( d ){
                            assert.ok( d.registered < end, `expected ${d.registered} to be less than ${end}` );
                            assert.ok( d.registered > start, `expected ${d.registered} to be greater than ${start}` )
						});
						done();

					})
					.catch( done )
			});

			it('should reject an invalid date range', function(done){
				assert.throws(function(){
					Model.filter( filters.range(Model.r, 'registered', ['2015-08-01', '2015-7-01']) )
						.limit(10)
						.then( function( data ){
							var start, end;
							data.length.should.be.above( 0 );

	                        // JS dates are 0 index. Rethink is 1
							start = new Date(2015, 7, 1)
							end = new Date(2015, 9 , 1)

							data.forEach(function( d ){
	                            assert.ok( d.registered < end, `expected ${d.registered} to be less than ${end}` );
	                            assert.ok( d.registered > start, `expected ${d.registered} to be greater than ${start}` )
							});
							done();

						})
						.catch( done )
				})

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

		describe('day', function( ){
			describe('~monday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'monday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(1);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~tuesday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'tuesday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(2);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~wednesday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'wednesday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(3);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~thursday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'thursday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(4);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~friday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'friday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(5);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~saturday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'saturday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(6);
							}
							done()
						})
						.catch( done );
				});
			});

			describe('~sunday',function(){
				it('should only return data on a specific day', function(done){
					Model.filter( filters.day( Model.r, 'registered', 'sunday'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCDay().should.equal(0);
							}
							done()
						})
						.catch( done );
				});
			});

		});

		describe('month', function(){
			describe('~janurary',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'january'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(0);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~February',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'february'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(1);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~march',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'march'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(2);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~april',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'april'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(3);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~may',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'may'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(4);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~june',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'june'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(5);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~july',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'july'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(6);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~august',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'august'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(7);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~september',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'september'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(8);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~october',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'october'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(9);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~november',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'november'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(10);
							}
							done()
						})
						.catch( done );
				});
			});
			describe('~december',function(){
				it('should only return data on a specific month', function(done){
					Model.filter( filters.month( Model.r, 'registered', 'december'))
						.limit(10)
						.then(function( data ){
							data.length.should.be.above(0)
							for(var d of data){
								d.registered.getUTCMonth().should.equal(11);
							}
							done()
						})
						.catch( done );
				});
			});
		});

		describe('year', function(){
			it('should only return data during 2014', function(done){
				Model.filter( filters.year( Model.r, 'registered', 2014))
					.limit(10)
					.then(function( data ){
						data.length.should.be.above(0)
						for(var d of data){
							d.registered.getUTCFullYear().should.equal(2014);
						}
						done()
					})
					.catch( done );
			});
			it('should only return data during 2015', function(done){
				Model.filter( filters.year( Model.r, 'registered', 2015))
					.limit(10)
					.then(function( data ){
						data.length.should.be.above(0)
						for(var d of data){
							d.registered.getUTCFullYear().should.equal(2015);
						}
						done()
					})
					.catch( done );
			});

			it('should only return data during 2016', function(done){
				Model.filter( filters.year( Model.r, 'registered', 2016))
					.limit(10)
					.then(function( data ){
						data.length.should.be.above(0)
						for(var d of data){
							d.registered.getUTCFullYear().should.equal(2016);
						}
						done()
					})
					.catch( done );
			});
		});
	});

});
