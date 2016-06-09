/*jshint laxcomma: true, smarttabs: true, node: true */
var child_process = require('child_process')
  , fs = require('fs')
  , util = require("util")
  , clone = require('mout/lang/clone')
  , production = (process.env.NODE_ENV === 'test')
  , env           = clone( process.env )                             // clone of current process env
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

env.MOCHA_COLORS=1

mocha = child_process.spawn("mocha", [
	"--growl"
	, "--recursive"
	, "--timeout=20000"
	, util.format("--reporter=%s", production ? 'xunit':'spec')
	, 'test/*.spec.js'
],{env: env});
mocha.on('exit', function( code, sig){
	process.exit( code );
});
mocha.on('error',console.log)
mocha.stdout.pipe( reporter );
mocha.stderr.pipe( reporter );
