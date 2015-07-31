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

### Paging
You can use a number of special query string params to control how data is paged on the list endpoint. Namely -

* `limit` - Page size ( default 25 )
* `offset` - The starting point in the list

`limit=25&offset=50` would be the start of page 3

### Sorting
sorting is handled query param orderby where you can pass it the name of a field to sort on. Sorting is descending by default. Specifying a negetive field ( -<FOO> ) would flip the order

### Advanced Filtering
You might have noticed the filtering field on the schema. One of the things that makes an API "Good" is the ability to use query and filter the data to get very specific subsets of data. Tastypie exposes this through the query string as field and filter combinations. By default, the resource doesn't have anything enabled, you need to specify which filters are allowed on which fields, or specify 1 to allow everything

#### Filter Types

| Filter      | function                                  |
| ------------|------------------------------------------ |
| gt          | greater than                              |
| gte         | greater than or equal to                  |
| lt          | less than                                 |
| lte         | less than or equal to                     |
| in          | Value in set ( [ 1,2,3 ])                 |
| nin         | Value Not in set                          |
| size        | Size of set ( array length )              |
| startswith  | Case Sensitive string match               |
| istartswith | Case Insensitive string match             |
| endswith    | Case Sensitive string match               |
| iendswith   | Case Insensitive string match             |
| contains    | Case Sensitive global string match        |
| icontains   | Case Insensitive global string match      |
| exact ( = ) | Exact Case Sensitive string match         |
| iexact      | Exact Case Insensitive string match       |
| match       | Matches an item in an array ( elemMatch ) |
