var issueRepo = require('../model/issue'),
	settingRepo = require('../model/settings'),
	LINQ = require('node-linq').LINQ,
	fs = require('fs'),
	mongoose = require('mongoose');
var slug = "/api/hero";

var serverSettings = {
			allowAnonIssues: true,
			allowAnonCommenting: true,
			autoApproveIssues: false,
			autoApproveComments: false,
		};

module.exports = function(app) {
	app.get(slug + "/issue", allIssues);
	app.post(slug + "/issue", newIssue);
	app.delete(slug + "/issue/:id", deleteIssue);
	app.put(slug + "/issue/:id", updateIssue);
	app.get(slug + "/issue/:id/image", showImage);
	app.post(slug + "/issue/:id/comment", newComment);
	app.get(slug + "/issue/:id/comment/:cid/image", showCommentImage);
	app.get(slug + "/settings",settings)
};

// gets the settings from the server
function settings(req, res){
	// it's the app asking for settings so send them back
	settingRepo.getSettings(function(err, settings) {
		return res.json(settings);
	});
}

function allIssues(req, res) {
	issueRepo.getAllVisible(function(err, results){
		var ret = new LINQ(results).Select(function(p) {
			delete p.imgData;
			p.imgUrl = "http://" + req.headers.host + "/api/hero/issue/" + p._id + "/image";
			return {
				"_id": p._id,
				"title": p.title,
				description: p.description,
				hidden: p.hidden,
				latitude: p.latitude,
				longitude: p.longitude,
				email: p.userEmail,
				status: p.status,
				category: p.category,
				openedDt: p.openedDt,
				resolvedDt: p.resolvedDt,
				resolvedComment: p.resolvedComment,
				resolvedDt: p.resolvedDt,
				imgUrl: "http://" + req.headers.host + "/api/hero/issue/" + p._id + "/image",
				comments: ( new LINQ(p.comments).Where( function(c){ return !c.hidden }).Select(function(c) { 
					return { 
						id: c.id, 
						text: c.text, 
						imgUrl: "http://" + req.headers.host + "/api/hero/issue/" + p._id + "/comment/" + c.id + "/image",
						userProfilePicUrl: c.userProfilePicUrl,
						author: c.userName,
						dt: c.dt,
						hidden: c.hidden
					} } ) ).items
			};
		});
		return res.json(ret.items);
	})
}

function showImage(req, res) {
	issueRepo.getById(req.params.id, function(err, issue) {
		res.contentType("image/png");
		return res.send(issue.imgData);
	});
}

function showCommentImage(req, res) {
	console.log("showing comment image");
	issueRepo.getById(req.params.id, function(err, issue) {

		for (var i = 0; i < issue.comments.length; i++) {
			 var cmt = issue.comments[i];
			 if(cmt.id == req.params.cid && cmt.imgData) {
			 	res.contentType("image/png");
				return res.send(cmt.imgData.buffer);
			 }
		};
		//TODO: return the user image instead
		return res.send(null);
		
	});
}

function newIssue(req, res) {
	//TODO: make sure we validate the inputs
	
	fs.readFile(req.files.imgData.path, function(err, data) {
		if(err) {return res.json({ msg: "reading error", "error": err});}
		var issue = { 
			userEmail: req.body.email,
			title: req.body.title,
			description: req.body.description,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			openedDt : req.body.openedDt,
			category : req.body.category,
			imgData: data, 
			contentType: req.files.imgData.type,
			hidden: (serverSettings.autoApproveIssues === true ? false : true)
		}
		console.log(issue);

		issueRepo.add(issue, function(error, result) {
			if(error) {return res.json({ msg: "adding error", "error": error});}
			return res.json({status: "issue added", reqBody: req.files.imgData });
		});
	});
}

function deleteIssue(req, res) {
	console.log(req.params);
	issueRepo.getById(req.params.id, function(err, issue) {
		if(req.body.email !== issue.userEmail) {
			return res.json({status: "Not Authorized"});
		}
		//TODO: add comment check here.
		issueRepo.delete(req.params.id, function(result) {
			return res.json({status: "issue deleted"});
		});
	})
}

function updateIssue(req, res) {
	var issue = { 
			_id: req.body._id,
			userEmail: req.body.email,
			title: req.body.title,
			description: req.body.description,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			openedDt : req.body.openedDt,
			category : req.body.category
		}
		console.log(issue);

	issueRepo.update(issue, function(err, result) {
		if(err) { 
			console.log(err); 
			return res.json(err);}
		return res.json({status: "comment updated"});
	});
}

function newComment(req, res) {
	issueRepo.getById(req.params.id, function(err, issue) {
		if(req.files && req.files.imgData ) {
			fs.readFile(req.files.imgData.path, function(err, data) {
				saveIssue(issue, req, data);
				return res.json({status: "comment added with image"});
			})
		}
		else {
			saveIssue(issue, req, null);
			return res.json({status: "comment added without image", body: req.body});
		}
	});
}

function saveIssue(issue, req, data) {
	var userProfilePicUrl = req.body.profilePicUrl
	if(serverSettings.allowAnonCommenting){
		userProfilePicUrl = 'http://' + req.headers.host + '/img/avatar.jpg';
	}

	settingRepo.getSetting("autoApproveComments", function(err, autoApprove){
		var comment = { 
			id: mongoose.Types.ObjectId(),
			text: req.body.text,
			userEmail: req.body.email,
			userName: req.body.name,
			userProfilePicUrl: userProfilePicUrl,
			dt: req.body.dt,
			imgData: data,
			hidden: !autoApprove
		};

		issue.comments.push(comment);
		issue.save();
	});
}