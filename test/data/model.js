var rethink       = require( 'thinky' )({db:'tastypie'})
  , type          = rethink.type
  , User
  , Tag
  , Power


Tag = rethink.createModel('tastypie_tag',{
  user_id:type.string()
},{
  pk:'name'
})


Post = rethink.createModel('tastypie_post',{
    title: type.string()
    ,user_id:type.string()
},{
    pk:'post_id'
});

var Company = rethink.createModel('tastypie_company',{
    name: type.string(),
    user_id: type.string(),
    address:{
        state: type.string(),
        city: type.string(),
        street: type.string(),
        country: type.string()
    }
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
 /*
    , company:    {
  	name:type.string()
  	,address:{
  		city:type.string(),
  		state:type.string(),
  		street:type.string(),
  		country:type.string()
  	}
  }
*/
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




User.r = rethink.r

User.hasOne( Company, 'company','id','user_id')
User.hasMany(Tag, 'tags', 'id', 'user_id');
User.hasMany(Post, 'posts', 'id', 'user_id');

module.exports = User;
module.exports.Tag = Tag
module.exports.Company = Company;
module.exports.Post = Post;
