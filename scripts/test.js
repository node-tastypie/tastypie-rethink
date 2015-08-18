/*jshint laxcomma: true, smarttabs: true, node: true */
var child_process = require('child_process')
  , fs = require('fs')
  , util = require("util")
  , production = (process.env.NODE_ENV === 'test')
  , html
  , coverage
  , mocha
  ;

if( production ){
	reporter = fs.createWriteStream('tap.xml',{
		flags:'w'
		,encoding:'utf8'
	});
} else {
	reporter = process.stdout;
}

mocha = child_process.spawn("mocha", [
	"--growl"
	, "--recursive"
	, "--timeout=20000"
	, util.format("--reporter=%s", production ? 'xunit':'spec')
	, 'test/*.spec.js'
]);
mocha.on('exit', function( code, sig){
	process.exit( code );
});
mocha.stdout.pipe( reporter );
mocha.stderr.pipe( reporter );
