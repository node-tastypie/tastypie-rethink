var rethink       = require( 'thinky' )({db:'tastypie'})
  , type          = rethink.type
  , User
  , Tag
  , Post
  , Shoe


Tag = rethink.createModel('tastypie_tag',{
  user_id:type.string()
},{
  pk:'name'
})


Shoe = rethink.createModel('tastypie_shoe',{
	brand:type.string().required()
	,color:type.string().required()
	,size: type.number().min(1).max(20).required().default( 1 )
},{
	pk:'shoe_id'
});

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
  , nested:{
  	one:type.number().default( 1 ),
  	two:type.number().default(2),
  	three:{
      four: type.string(),
      five: type.string()
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


User.pre('save',function( next ){
  this.registered = new Date( this.registered )
  next();
})

User.r = rethink.r

User.hasOne( Company, 'company','id','user_id')
User.hasMany(Tag, 'tags', 'id', 'user_id');
User.hasMany(Post, 'posts', 'id', 'user_id');

User.hasAndBelongsToMany(Shoe,'shoes', 'id','shoe_id');

module.exports = User;
module.exports.Tag = Tag
module.exports.Company = Company;
module.exports.Post = Post;
module.exports.Shoe = Shoe;
