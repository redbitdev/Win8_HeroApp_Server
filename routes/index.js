var util = require('util'),
	fs = require('fs'),
	easyxml = require('easyxml'),
	LINQ = require('node-linq').LINQ,
	RSS = require('rss'),
	csv = require('express-csv'),
	poi = require('../model/issue'),
	config = require('../config'),
	dataTable = require('../model/dataTable')
	issueRepo = require('../model/issue');

easyxml.configure({
  singularizeChildren: true,
  underscoreAttributes: true,
  rootElement: 'response',
  dateFormat: 'ISO',
  indent: 2,
  manifest: true
});

exports.index = function(req, res) {
	res.render('index', {
		user: req.user,
		layout: 'layout'
	});
};

exports.login = function(req, res) {
	res.render('login', {
		layout: null
	});
}

exports.upload = function(req, res) {
	res.render('upload', {
		user: req.user,
		layout: 'layout'
	});
}

exports.view = function(req, res) {
	res.render('view', {
		user: req.user,
		tableName: req.params.tableName,
		layout: 'layout'
	});
}

exports.viewDetails = function(req, res) {
	issueRepo.getById(req.params.id, function(err, issue) {
		console.log(issue.comments[0])
		res.render('details', {
			user:req.user,
			issue: issue,
			layout: 'layout'
		})
	});
}

exports.map = function(req, res) {
	res.render('map', {
		user: req.user,
		tableName: req.params.tableName,
		layout: 'layout'
	});
}

exports.add = function(req, res) {
	res.render('add', {
		user: req.user,
		layout: 'layout'
	});
}

exports.uploadPost = function(req, res) {
	fs.readFile(req.files.fileInput.path, 'utf8', function(err, data) {
		if(err) throw err;

		var tableName = req.body.datasetName.replace(' ', '_');
		var path = req.body.pathToItems.split(',');
		var json = JSON.parse(data);

		var arr = json;

		if(req.body.pathToItems && req.body.pathToItems.length > 0) {
			for(var j = 0; j < path.length; j++) {
				arr = arr[path[j]];
			}
		}

		for(var i = arr.length - 1; i >= 0; i--) {
			poi.addPoiToDb(tableName, arr[i]);
		};

		dataTable.add(tableName, req.user);

		res.render('uploaded', {
			user: req.user,
			fileName: req.files.fileInput.name,
			recordsAdded: arr.length,
			tableName: tableName
		});
	});
};

exports.select = function(req, res) {
	var format = req.params.format;
	if(!format) format = 'json';

	var tableName = req.params.tableName;

	if(format === "csv" && req.query.ids) {
		try
		{
			poi.getByIds(tableName, req.query.ids.split(','), function(err, pois) {
				var ret = new LINQ(pois).Select(function(p) {
					return p.data
				});
				return res.csv(ret.items);
			});
		}
		catch(err) { console.log(err ); }
	}
	else {
		poi.getAll(function(err, results){
		var ret = new LINQ(results).Select(function(p) {
			delete p.imgData;
			p.imgUrl = "http://" + req.headers.host + "/api/hero/issue/" + p._id + "/image";
			return {
				"_id": p._id,
				"title": p.title,
				description: p.description,
				category: p.category,
				status: p.status,
				openedDt: p.openedDt,
				latitude: p.latitude,
				longitude: p.longitude,
				hidden: p.hidden
			}
		});
			if( format === "xml") {
				res.header('Content-Type', 'text/xml');
	            var xml = easyxml.render({ results: ret.items});
	            return res.send(xml);
			}
			else if(format === "csv") {
				return res.csv(ret.items);
			}
			else if(format === "rss") {
				res.header('Content-Type', 'text/xml');
	            /* lets create an rss feed */
				var feed = new RSS({
				        title: config.appTitle,
				        description: 'Details of the ' + tableName + ' data collection.',
				        feed_url: 'http://' + req.host + '/api/data/' + tableName + '.rss',
				        site_url: 'http://' + req.host,
				       // image_url: 'http://example.com/icon.png',
				       // author: 'Dylan Greene'
				    });

				/* loop over data and add to feed */
				new LINQ(ret.items).Select(function(p) {
					feed.item({
					    title:  p.title,
					    description: p.description,
					    //url: 'http://example.com/article4?this&that', // link to the item
					    //guid: '1123', // optional - defaults to url
					    //author: 'Guest Author', // optional - defaults to feed author property
					    //date: 'May 27, 2012' // any format that js Date can parse.
					});
				});
				
	            return res.send(feed.xml());
			}
			return res.json(ret.items);
		});
	}
}

exports.tables = function(req, res) {
	return res.json(['Issues']);
	/*var dataTables = dataTable.getAll(function(err, tables) {
		var ret = new LINQ(tables).Select(function(p) {
			return p.name
		});
		return res.json(ret.items);
	});*/
}

exports.dismiss = function(req, res) {
	var ids = req.body.ids.split(',');
	for (var i = 0; i < ids.length; i++) {
		var id = ids[i];
		poi.delete(id, function() {
			return res.json({status: "Ok"});
		});
	};
}

exports.changeVis = function(req, res) {
	var ids = req.body.ids.split(',');
	for (var i = 0; i < ids.length; i++) {
		var id = ids[i];
		poi.updateVis(id, req.body.hide, function() {
			return res.json({status: "Ok"});
		});
	};
}

exports.changeVisComment = function(req, res) {
	poi.updateVisComment(req.body.issueId, req.body.id, req.body.hide, function(err, obj) {
			console.log("update done");
			console.log(err);
			console.log(obj);
			return res.json({status: "Ok"});
	});
	
}
exports.deleteComment = function(req, res) {
	poi.deleteComment(req.body.issueId, req.body.id, function(err, obj) {
			return res.json({status: "Ok"});
	});
	
}