var TABLE = 'Issues';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	settings = require('./settings'),
	Schema = mongoose.Schema;

db.init();

//Helper method
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

module.exports = {
	_commentSchema: new Schema({
		id: Schema.ObjectId,
		userEmail: String,
		userName: String,
		userProfilePicUrl: String,
		text: String,
		dt: Date,
		imgData: Buffer,
		hidden: Boolean
	}),
	_schema: new Schema({
		userEmail: String,
		title: String,
		description: String,
		openedDt: Date,
		resolvedDt: Date,
		status: String,
		resolvedComment:String,
		category:String,
		imgData: Buffer, 
		contentType:String,
		imgUrl:String,
		latitude:Number,
		longitude:Number,
		hidden: Boolean,
		comments: [module.exports._commentSchema]

	}),
	add: function(issue, callback) {

		var commentModel = mongoose.model("Comments", this._commentSchema);
		var comment = new commentModel();
		var model = mongoose.model(TABLE, this._schema);
		var data = new model();

		data.userEmail = issue.userEmail;
		data.title = issue.title;
		data.description = issue.description;
		data.contentType = issue.contentType;
		data.imgData = issue.imgData;
		data.latitude = issue.latitude;
		data.longitude = issue.longitude;
		data.imgUrl = issue.imgUrl;
		data.openedDt = issue.openedDt;
		data.resolvedDt = issue.resolvedDt;
		data.status = "New";
		data.resolvedComment = issue.resolvedComment;
		data.category = issue.category;

		settings.getSetting("autoApproveIssues", function(err, autoApprove){
			data.hidden = !autoApprove;
			data.save(callback);			
		});


	},
	getById: function(id, callback){
		var model = mongoose.model(TABLE, this._schema);
		model.findOne({_id: id}, callback);		
	},
	getAllVisible: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({hidden:false}, callback);
	},
	getAll: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({}, callback);
	},
	getJustDataVisible: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({hidden:false}, "_id title status category openedDt description latitude longitude", callback);
	},
	delete: function(id, callback) {
		console.log("Deleting: " + id);
		module.exports.getById(id, function(err, issue) {
			if(issue) {
				console.log(issue);
				issue.remove(callback);
			}
		});
	},
	update: function(issue, callback) {
		console.log("Updating: " + issue);
		module.exports.getById(issue._id, function(err, oldIssue) {
			oldIssue.title = issue.title;
			oldIssue.description = issue.description;
			oldIssue.category = issue.category;
			oldIssue.imgUrl = issue.imgUrl;
			oldIssue.save(callback);
		})
	},
	updateVis: function(id, hide, callback) {
		console.log("about to update the vis of " + id + " it will be hidden = " + typeof( hide ));
		module.exports.getById(id, function(err, oldIssue) {
			if(oldIssue) {
				oldIssue.hidden = hide == "true";
				oldIssue.save(callback);
			}
		});
	},
	updateVisComment: function(issueId, id, hide, callback) {
		console.log("about to update the vis of comment " + id + " of issue " + issueId + " it will be hidden = " +  hide );

		var model = mongoose.model(TABLE, this._schema);
		
		
		model.update(
			{ _id: issueId, 'comments.id': new mongoose.Types.ObjectId(id)}
  			, { $set: {'comments.$.hidden': hide === "true" } }
  			, callback
		);
	},
	deleteComment: function(issueId, id, callback) {
		var model = mongoose.model(TABLE, this._schema);

		model.findOneAndUpdate(
				{_id: issueId},
				{$pull: { comments: {id: new mongoose.Types.ObjectId(id) }}},
				callback
			);
	}

}