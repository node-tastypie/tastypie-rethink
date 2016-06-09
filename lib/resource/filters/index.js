/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * index.js
 * @module index.js
 * @author 
 * @since 0.0.1
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 */

var gt          = require('./gt')
  , gte         = require('./gte')
  , lt          = require('./lt')
  , lte         = require('./lte')
  , ne          = require('./ne')
  , nin         = require('./nin')
  , infilter    = require('./in')
  , all         = require('./all')
  , size        = require('./size')
  , exact       = require('./exact')
  , regex       = require('./regex')
  , iexact      = require('./iexact')
  , contains    = require('./contains')
  , icontains   = require('./icontains')
  , startswith  = require('./startswith')
  , istartswith = require('./istartswith')
  , endswith    = require('./endswith')
  , iendswith   = require('./iendswith')
  ;

Object.defineProperties( exports, {
	gt:{
		writable:false
		,value:function(){
			return gt;
		}
  }

  , gte:{
		writable:false
		,value:function(){
			return gte;
		}
  }

  , lt:{
		writable:false
		,value:function(){
			return lt;
		}
  }

  , lte:{
		writable:false
		,value:function(){
			return lte;
		}
  }

  , ne:{
		writable:false
		,value:function(){
			return ne;
		}
  }

  , nin:{
		writable:false
		,value:function(){
			return nin;
		}
  }

  , size:{
		writable:false
		,value:function(){
			return size;
		}
  }

  , exact:{
		writable:false
		,value:function(){
			return exact;
		}
  }

  , regex:{
		writable:false
		,value:function(){
			return regex;
		}
  }

  , iexact:{
		writable:false
		,value:function(){
			return iexact;
		}
  }

  , contains:{
		writable:false
		,value:function(){
			return contains;
		}
  }

  , icontains:{
		writable:false
		,value:function(){
			return icontains;
		}
  }

  , startswith:{
		writable:false
		,value:function(){
			return startswith;
		}
  }

  , istartswith:{
		writable:false
		,value:function(){
			return istartswith;
		}
  }

  , endswith:{
		writable:false
		,value:function(){
			return endswith;
		}
  }

  , iendswith:{
		writable:false
		,value:function(){
			return iendswith;
		}
  }
  , in:{
		writable:false
		,value:function(){
			return infilter;
		}
  }
  , all:{
  		writable:false
  		,value:function(){
  			return all;
  		}
  }
});
