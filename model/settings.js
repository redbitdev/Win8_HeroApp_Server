var TABLE = 'Settings';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	Schema = mongoose.Schema;

db.init();

module.exports = {
	_schema: new Schema({
		allowAnonIssues: Boolean,
		allowAnonCommenting: Boolean,
		autoApproveIssues: Boolean,
		autoApproveComments: Boolean,

	}),
	getSettings: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.findOne({}, function(error, settings){
			if(!settings) {
				var model = mongoose.model(TABLE, this._schema);
				var data = new model();
				data.allowAnonIssues= true;
				data.allowAnonCommenting= true;
				data.autoApproveIssues= false;
				data.autoApproveComments= false;
				data.save(function(err) {
					callback(err, data);
				});
			}
			else
				callback(error, settings);
		});
	},

	getSetting: function(field,callback) {
		module.exports.getSettings(function(err, settings) {
			callback(err, settings[field]);
		});
	}

}