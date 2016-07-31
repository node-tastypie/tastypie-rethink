var rethink       = require( 'thinky' )({db:'tastypie'})
  , type          = rethink.type
  , User
  , Tag


Tag = rethink.createModel('tastypie_tag',{
  user_id:type.string()
},{
  pk:'name'
})

User =  rethink.createModel('tastypie_user',{
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
  , registered: type.date()
  , latitude:   type.number()
  , longitude:  type.number()
  , range:      [type.number()]
  , friends:    [{name:type.string(), id:type.number() }]
});


User.pre('save', function( done ){
  this.id = undefined;
  done();
})


User.r = rethink.r

User.hasMany(Tag, 'tags', 'id', 'user_id');

module.exports = User;
module.exports.Tag = Tag
