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
  , range       = require('./range')
  , isnull       = require('./isnull')
  ;

Object.defineProperties( exports, {
	gt:{
		configurable:false
		,get:function(){
			return gt;
		}
  }

  , gte:{
		configurable:false
		,get:function(){
			return gte;
		}
  }

  , lt:{
		configurable:false
		,get:function(){
			return lt;
		}
  }

  , lte:{
		configurable:false
		,get:function(){
			return lte;
		}
  }

  , ne:{
		configurable:false
		,get:function(){
			return ne;
		}
  }

  , nin:{
		configurable:false
		,get:function(){
			return nin;
		}
  }

  , size:{
		configurable:false
		,get:function(){
			return size;
		}
  }

  , exact:{
		configurable:false
		,get:function(){
			return exact;
		}
  }

  , regex:{
		configurable:false
		,get:function(){
			return regex;
		}
  }

  , iexact:{
		configurable:false
		,get:function(){
			return iexact;
		}
  }

  , contains:{
		configurable:false
		,get:function(){
			return contains;
		}
  }

  , icontains:{
		configurable:false
		,get:function(){
			return icontains;
		}
  }

  , startswith:{
		configurable:false
		,get:function(){
			return startswith;
		}
  }

  , istartswith:{
		configurable:false
		,get:function(){
			return istartswith;
		}
  }

  , endswith:{
		configurable:false
		,get:function(){
			return endswith;
		}
  }

  , iendswith:{
		configurable:false
		,get:function(){
			return iendswith;
		}
  }
  , in:{
		configurable:false
		,get:function(){
			return infilter;
		}
  }
  , all:{
  		configurable:false
  		,get:function(){
  			return all;
  		}
  }
  , range:{
  		configurable:false
  		,get:function(){
  			return range;
  		}
  }  
  , isnull:{
  	configurable: false
  	,get:function(){
  		return isnull;
  	}
  }
});
