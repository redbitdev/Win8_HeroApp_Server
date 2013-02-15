var TABLE = 'DataTable';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	Schema = mongoose.Schema;

db.init();

module.exports = {
	_schema: new Schema({
		name: String,
		userName: String,
		dt: Date

	}),
	add: function(table, user) {

		var model = mongoose.model(TABLE, this._schema);
		var data = new model();

		data.name = table;
		data.userName = user.displayName;
		data.dt = new Date();

		data.save();
	},
	getAll: function(callback) {
		var model = mongoose.model(TABLE, this._schema);

		model.find({}, callback);
	}
}