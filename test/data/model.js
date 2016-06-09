var rethink       = require( 'thinky' )({db:'tastypie'})
  , type          = rethink.type

module.exports = rethink.createModel('tastypie_model',{
	index:      type.number()
  , guid:       type.string()
  , isActive:   type.boolean().default(false)
  , balance:    type.string()
  , picture:    type.string()
  , age:        type.number()
  , eyeColor:   type.string()
  , date:       type.date()
  , name:       type.string()
  , company:    {
  	name:type.string()
  	,address:{
  		city:type.string(),
  		state:type.string(),
  		street:type.string(),
  		country:type.string()
  	}
  }
  , email:      type.string()
  , phone:      type.string()
  , address:    type.string()
  , about:      type.string()
  , registered: type.string()
  , latitude:   type.number()
  , longitude:  type.number()
  , tags:       [type.string()]
  , range:      [type.number()]
  , friends:    [{name:type.string(), id:type.number() }]
});

module.exports.r = rethink.r
