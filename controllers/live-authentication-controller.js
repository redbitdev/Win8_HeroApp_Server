var passport = require('passport'),
    userRepo = require('../model/user'),
	WindowsLiveStrategy = require('passport-windowslive').Strategy;

// get key at dev.live.com
var WINDOWS_LIVE_CLIENT_ID = "00000000440F023B"
var WINDOWS_LIVE_CLIENT_SECRET = "sKteZ5eC2WEo79XRNt4SBnIEwWfOAblB";

var strategy = new WindowsLiveStrategy({
	clientID: WINDOWS_LIVE_CLIENT_ID,
	clientSecret: WINDOWS_LIVE_CLIENT_SECRET,
	callbackURL: "http://heroapp.azurewebsites.net/auth/windowslive/callback"
}, function(accessToken, refreshToken, profile, done) {
	// asynchronous verification, for effect...
	process.nextTick(function() {
		userRepo.getByLiveId(profile.id, function(error, user) {

			if(error) {
				return done(error, null);
			}
			if(user) {
				return done(null, user);
			}

			userRepo.add(profile, function(err, usr) {
				return done(null, usr);
			});
		});
	});
});

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(strategy);


module.exports = function(app) {

	app.get('/auth/windowslive', passport.authenticate('windowslive', {
		scope: ['wl.signin', 'wl.basic']
	}), function(req, res) {});

	app.get('/auth/windowslive/callback', passport.authenticate('windowslive', {
		failureRedirect: '/login'
	}), function(req, res) {
		res.redirect('/');
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};