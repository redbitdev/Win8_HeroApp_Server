var mongoose = require('mongoose');
// get your free mongodb at www.mongolab.com
var path = 'mongodb://heroapp:heroapp@ds045087.mongolab.com:45087/heroappG';
module.exports = {
	_db: null,
	init: function() {
		if(!module.exports._db) {

			module.exports._db = mongoose.connect(path, {
							        server:{
							            auto_reconnect: true,
							            socketOptions:{
							                connectTimeoutMS:3600000,
							                keepAlive:3600000,
							                socketTimeoutMS:3600000
							            }
							        }});

		}
		return module.exports._db;
	}
}