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
var  Model = thinky.createModel('tastypie_model',{
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

| Filter      | function                                         |
| ------------|------------------------------------------------- |
| gt          | greater than                                     |
| gte         | greater than or equal to                         |
| lt          | less than                                        |
| lte         | less than or equal to                            |
| in          | Value in set ( [ 1,2,3 ])                        |
| nin         | Value Not in set                                 |
| size        | Size of set ( array length )                     |
| startswith  | Case Sensitive string match                      |
| istartswith | Case Insensitive string match                    |
| endswith    | Case Sensitive string match                      |
| iendswith   | Case Insensitive string match                    |
| contains    | Case Sensitive global string match               |
| icontains   | Case Insensitive global string match             |
| exact ( = ) | Exact Case Sensitive string match                |
| iexact      | Exact Case Insensitive string match              |
| match       | Matches an item in an array ( elemMatch )        |
| isnull      | matches null values                              |
| month       | Matches date values on a specific month          |
| day         | Matches date values on a speciec day of the week |
| year        | Matches date values on a specific year           |

Filters are added by appending a double underscore ``__`` and the filter type to the end of a field name. Given our example, if we wanted to find people who were older than 25, we would use the following URI syntax

```bash
http://localhost:3000/api/v1/user?age__gt=25
```
Filters are additive for a given field. For example, if we we only wanted people where we between 25 and 45, we would just add another filter

```bash
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45
```

The same double underscore `__` syntax is used to access nested fields where the filter is always the last parameter. So we could find people whos age was  **greater than** 25, **less than** 45 and whose Company Name **starts with** `W`

```bash
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45&company__name__istartswith=w
```

Remember, remapped fields still work for filtering, so the same would also be true for `companyName`

```bash
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45&companyName__istartswith=w
```

Resources provide a simple and expressive syntax to query for very specific subsets of data without any of the boilerplate work to set it up. And as you would expect, regular params will map back to `exact` where applicable

```bash
http://localhost:3000/api/v1/user?age=44
```


#### Serialization

Tastypie supports multiple serialization formats out of the box as well as a way to define your own custom formats. The base `serializer` class supports `xml`, `json` & `jsonp` by default. You add formats or create your own serialization formats by subclassing the `Serializer` class and defining the approriate methods. Each format must define a `to_<FORMAT>` and a `from_<FORMAT>`. For example, tastypie defines the `to_xml` and `from_xml` methods. JSON is defined by `to_json`, `from_json`

To get back xml just change the `Accept` header
**NOTE:** *Hapi deals with most `application/foo` formats, but is blind to `text/foo`. So the safe bet here is to use `text/xml`*

```xml
// curl -H "Accept: text/xml" http://localhost:3000/api/v1/user

<?xml version="1.0" encoding="UTF-8"?>
<response>
 <meta type="object">
  <count type="number">100</count>
  <limit type="number">1</limit>
  <offset type="number">0</offset>
  <previous type="null">null</previous>
  <next type="string">/api/v1/meth?limit=25&offset=25</next>
 </meta>
 <data type="array">
  <object type="object">
   <name type="string">Dejesus Zimmerman</name>
   <age type="number">31</age>
   <companyName type="string">AVENETRO</companyName>
   <id type="string">557af820f3c3008b415de02c</id>
   <uri type="string">/api/v1/meth/557af820f3c3008b415de02c</uri>
  </object>
 </data>
</response>
```

### Relationships

There are three new field types to deal with related data - the [hasone](./lib/fields/hasone.js) field deals with foreign key type relations.
The [hasmany](./lib/fields/hasmany.js) field deals with both many to many relations and reverse end of a foreign key ( many to one ).
The [document](./lib/fields/document.js) manages nested documents to an arbitrary level with in the same document.

Using these fields on resources allows for creation or linking of documents through either a valid URI pointing to another resource,
or existing objects. 


```js
                                        tastypie.Resource.extend({
                                          options:{
                                              name:'address',
                                              includeUri: false // <- important
                                          },
                                          fields:{
                                            state    : { type: 'char', nullable: false},
                                            city     : { type: 'char', nullable: false},
                                            street   : { type: 'char', nullable: false},
                                            country  : { type: 'char', nullable: false}
                                          }
                                        });

                                        //  NESTED DOCUMENT FIELD  
think.createModel('tastypie_company',{  RethinkResource.extend({
  name: type.string(),                    options:{
  user_id: type.string(),                   name:'company'
  address:{                                 queryset: Company.filter({})
      state: type.string(),               },
      city: type.string(),                fields:{
      street: type.string(),                name    : { type:'string', required:true},
      country: type.string()                address : { type:'document', to: AddressResource }
  }                                       },
)}                                        constructor: function( options ){
                                            this.parent( 'constructor', options );
                                          }
                                        });

                                        // HAS ONE RELATION
rethink.createModel('tastypie_user',{   RethinkResource.extend({
    name:       type.string()             options:{
  , age:        type.number()               name:'user'
  , eyeColor:   type.string()               queryset: User.filter({})
  , email:      type.string()             },
  , phone:      type.string()             fields:{
  , registered: type.date()                 name    : { type: 'string', required:true },
});                                         company : { type: 'hasone', to: CompanyResource, nullable:true },
User.hasOne(Company,'company','id','id')    eyes    : { type: 'char', attribute: 'eyeColor' },
                                            phone   : { type: 'char'},
                                            registered : { type: 'datetime' }
                                          },
                                          constructor: function( options ){
                                            this.parent( 'constructor', options );
                                          }
                                        });

v1     = new tastypie.Api('api/v1');
server = new hapi.Server();
v1.use( new CompanyResource());
v1.use( new UserResource() );

server.connection({port:3000});

server.register([v1], function(){
  server.start( console.log );
});
```


With this set up you are able to create the `User`, `Company` and `Address` with a single request by
posting data like this

```js
{
  "name":"Billy Blanks",
  "phone":"2125555555",
  "eyes":"blue",
  "age": 21,
  "registered":"2016-08-11T12:08:27.691Z"
  "company":{
    "name":"TaeBo",
    "address":{
       . . .
    }
  },
  "address":{
     . . . 
  }
}
```

Linking Documents is just as easy. You may send a request payload using the URI provided by the corresponding endpoint for the resource, or
send an object containing the primary key  property set. Below are example payloads that would let a user to company `5a029ea5-142d-4056-bda5-8dc902a7b954`

```js
{                                                                  {
  . . .                                                              . . .
  "company":"/api/v1/company/5a029ea5-142d-4056-bda5-8dc902a7b954"   "company":{
}                                                                        "id":"5a029ea5-142d-4056-bda5-8dc902a7b954"
                                                                     }
                                                                   }
```
