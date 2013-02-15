var mongoose = require('mongoose'),
    db = require('./baseRepo'),
    Schema = mongoose.Schema;

db.init();

module.exports = {
	addPoiToDb : function(table, obj) {

		var schema = new Schema({ data: Schema.Types.Mixed});
		var model = mongoose.model(table, schema);

		var poi = new model();

		poi.data = obj;
		poi.markModified('data');
		poi.save();
	},

	getAll : function(table, callback) {
		var schema = new Schema({ data: Schema.Types.Mixed});
		var model = mongoose.model(table, schema);

		model.find({}, callback);
	},

	getByIds : function(table, idCol, callback) {
		var schema = new Schema({ data: Schema.Types.Mixed});
		var model = mongoose.model(table, schema);

		model.find({ "data.entityid": { $in: idCol } }, callback);
	}

}