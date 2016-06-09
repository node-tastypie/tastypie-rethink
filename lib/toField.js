const SEP = '__';

module.exports = function toField( r, field ){
	field = field.split( SEP );
	var ret = r.row( field.shift() );
	while( field.length ){
		ret = ret( field.shift() );
	}
	return ret;
};
