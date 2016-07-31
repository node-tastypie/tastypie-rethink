/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * hasone.js
 * @module hasone.js
 * @author 
 * @since 0.0.1
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 */

var moduleA = require( 'moduleA' )
  , moduleB = require( 'moduleB' )
  , moduleC = require( 'moduleC' )
  ;

/**
 * Description
 * @class module:hasone.js.Thing
 * @param {TYPE} param
 * @example var x = new hasone.js.THING();
 */

exports.THING = Object.create(/* @lends module .THING.prototype */{
	
	/**
	 * This does something
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @returns something
	 **/
	method: function(){

		/**
		 * @name hasone.js.Thing#event
		 * @event
		 * @param {TYPE} name description
		 **/	
		this.emit('event', arg1, arg2)
	}
});
