var express = require('express')
  , routes = require('./routes')
  , userRepo = require('./model/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , util = require('util')
  , hogan = require('hogan-express');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.engine('mustache', hogan);
  app.set('view engine', 'mustache');
  app.set('layout',  __dirname + '/views/layout');
  app.use(express.errorHandler());
  app.use(express.logger('tiny'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
});

app.get('/', ensureAuthenticated, routes.index);
app.get('/login', routes.login);
app.get('/upload', ensureAuthenticated, routes.upload);
app.get('/add', ensureAuthenticated, routes.add);
app.get('/view/:tableName', ensureAuthenticated, routes.view);
app.get('/view/:tableName/:id', ensureAuthenticated, routes.viewDetails);
app.get('/map/:tableName', ensureAuthenticated, routes.map);
app.get('/api/tables', routes.tables);
app.post('/api/changeVis', routes.changeVis);
app.post('/api/changeVisComment', routes.changeVisComment);
app.post('/api/deleteComment', routes.deleteComment);
app.post('/api/dismiss', routes.dismiss);
app.get('/api/data/:tableName.:format?', routes.select);
app.post('/upload', ensureAuthenticated, routes.uploadPost);
app.get('/debug-user', function(req, res) { return res.json(req.user);});


//Load up all the controllers.
var controllers_path = __dirname + '/controllers',
    controller_files = fs.readdirSync(controllers_path);

controller_files.forEach(function(file) {
  require(controllers_path + '/' + file )(app);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


//TODO: this should move to the auth controller!!!
function ensureAuthenticated(req, res, next) {
  if(req.host === 'localhost') {
    req.user = {displayName: 'John Doe', isAdmin: true};
    next();
  }
  else {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  }
}
