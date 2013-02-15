var settingsRepo = require("../model/settings");

var slug = "/dash";

module.exports = function(app) {
	app.get( slug + '/settings', makeAuth, settings);
	app.post( slug + '/settings', makeAuth, updateSettings); 
};

function settings(req, res) {
	settingsRepo.getSettings(function(err, sets) {
		res.render('dash/settings', {
			user:req.user,
			settings: sets,
			layout: 'layout'
		});
	});
}

function updateSettings(req, res) {
	console.log(req.body);
	settingsRepo.getSettings(function(err, sets) {
		sets.allowAnonIssues = req.body.allowAnonIssues === 'on';
		sets.allowAnonCommenting = req.body.allowAnonCommenting === 'on';
		sets.autoApproveIssues = req.body.autoApproveIssues === 'on';
		sets.autoApproveComments = req.body.autoApproveComments === 'on';
		sets.save(function(err) {
			res.redirect(slug + "/settings");
		})
	});
	return null;
}


//TODO: this should move to the auth controller!!!
function makeAuth(req, res, next) {
  if(req.host === 'localhost') {
  	req.user = {displayName: 'John Doe', isAdmin: true};
    next();
  }
  else {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  }
}
