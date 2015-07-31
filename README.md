
[ ![Codeship Status for esatterwhite/tastypie-mongo](https://codeship.com/projects/2517df60-0a1f-0133-9779-1e445c7f4e51/status?branch=master)](https://codeship.com/projects/90663)

# tastypie-rethink

A Tastypie resource for mongoose.

##### Install Mongoose Resource

```js
npm install mongoose tastypie-mongoose
```

##### Make A mongoose Model
```js
// Make A Mongoose Model
var Schema = new mongoose.Schema({ 
	name:{
		first:{type:String}
		,last:{type:String}
	}
	,index:{type:Number, required:false}
	,guid:{type:String, requierd:false}
	,tags:[{type:String}]
}, {collection:'tastypie'})

var Test = connection.model('Test', Schema)
```

##### Define A Resource
```js
var tastypie = require("tastypie");
var MongoseResource = tastypie.Resource.Mongoose;

// Default Query
var queryset = Test.find().lean().toConstructor()

// Define A Mongo Resource
var Mongo = MongoseResource.extend({
	options:{
		queryset: queryset
	}
	,fields:{
		firstName: {type:'CharField', attribute:'name.first'} // Remaps name.first to firstName
		,lastName: {type:'CharField', attribute:'name.last'} // Remaps name.last to lastName
	}
})
