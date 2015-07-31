[ ![Codeship Status for esatterwhite/tastypie-rethink](https://codeship.com/projects/cd4d3ff0-19f6-0133-de03-1e278c59189d/status?branch=master)](https://codeship.com/projects/94295)

# tastypie-rethink

A Tastypie resource for Rethink.

##### Install Rethink Resource

```js
npm install thinky tastypie-rethink
```

##### Make A Rethink Model
```js
// Make A Rethink Model
var  Model = rethink.createModel('tastypie_model',{
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

});

```

##### Define A Resource
```js
var tastypie = require("tastypie");
var RethinkResource = require('tastypie-rethink');
var queryset, Rethink;
Rethink = RethinkResource.extend({
	options:{
		queryset: Model.filter({});
		,filtering:{
			name:1,
			age:['lt', 'lte'],
			company:1
		}
	}
	,fields:{
		name:{type:'char', attribute:'name'},
		age:{type:'int'},
		eyes:{type:'char', attribute:'eyeColor'},
		companyName:{ type:'char', attribute:'company.name' }
	}
});
```
