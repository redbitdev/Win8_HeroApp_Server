var dataTable;

$(document).ready(function() {
	$.getJSON('/api/tables', function(data) {
		$.each(data, function(key, val) {
			var li = '<li class="nav-header hidden-tablet">' + val + '</li>';
			li += '<li><a class="ajax-link" href="/view/' + val + '"><i class="icon-th"></i><span class="hidden-tablet">Data</span></a></li>';
			li += '<li><a class="ajax-link" href="/map/' + val + '"><i class="icon-globe"></i><span class="hidden-tablet">Map</span></a></li>';
			$('#sidebar-menu').append(li);
		});
	});
	var th = $('#table-header');

	if(th) {
		var tableName = th.data('tablename');
		console.log('looking up ' + tableName);
		$.getJSON("/api/data/" + tableName, function(data) {
			//first add the headers:
			
			$.each(data, function(key, val) {

				var cls = key % 2 === 0 ? 'odd' : 'even';
				var html = '<tr class="' + cls + '">';
				html+= '<td><input type="checkbox" class="selector check" data-id="' + val._id + '" />';
				html += '<td><a href="/view/' + tableName + '/' + val._id + '/">' + val.title + '</a></td>'
				html += '<td>' + val.description + '</td>'
				html += '<td>' + val.category + '</td>'
				html += '<td>' + val.status + '</td>'
				html += '<td>' + val.openedDt + '</td>'
				html += '<td>' + val.hidden + '</td>'
				
				html += "</tr>";
				$('#table-body').append(html);
			});

			dataTable = $('.datatable').dataTable({
				"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span12'i><'span12 center'p>>",
				"sPaginationType": "bootstrap",
				"oLanguage": {
				"sLengthMenu": "_MENU_ records per page"
				}
			} );
		});
	}

	var map = $('#map-canvas');

	if( map ) {

		$('#map-canvas').jump({'credentials': 'AvOW5Fz4QTsubTTdmaVnseeZnAQ0JYwbx_6zdMdgHk6iF-pnoTE7vojUFJ1kXFTP', 'enableSearchLogo': false }, function() {
			var self = this;
			var tableName = map.data('tablename');
			console.log('looking up ' + tableName);
			
			$.getJSON( "/api/data/" + tableName, function(response) {
				$.each( response, function(i, obj) {
					var location = new Microsoft.Maps.Location(obj.latitude, obj.longitude);
					self.addMarker({ 'location': location, 'bounds': true, 'title': obj.location } )
				});
			});
		});
	}

	$('#download-csv li a').click(function(e){
		e.preventDefault();
		var type = $(e.target).data('type');
		var table = $(e.target).data('tablename');


		var id = "";

		if(type === 'selected' ) {
			id = getSelectedRows();
		}
		else if( type === 'visible') {
			$.each($('.check'), function(i, obj) {
				id += $(obj).data('id') + ",";
			})
		}

		window.open("/api/data/" + table + ".csv?ids=" + id);

	});

	$('#btnHide').click(function(e) {
		var id = getSelectedRows();
		toggleVis(true, id);
	});

	$('#btnShow').click(function(e) {
		var id = getSelectedRows();
		toggleVis(false, id);
	});

	$('#btnDismiss').click(function(e) {
		var id = getSelectedRows();
		if(confirm("Are you sure you want to dismiss these " + (id.split(',').length - 1) + " Issues? \n This operation can not be undone" )) {
			$.ajax({
			  type: "POST",
			  url: "/api/dismiss",
			  data: { ids: id }
			}).done(function( msg ) {
			 	location.reload();
			});
		}
		else {
			console.log("Decided not to delete");
		}

	});

	$("#toggle-issue").click(function(e) {
		var tg = $(e.currentTarget);
		var current = tg.data("ishidden");
		var id = tg.data("id") + ",";
		toggleVis(!current, id);
	})

	$("#delete-issue").click(function(e) {
		var tg = $(e.currentTarget);
		var id = tg.data("id") + ",";
		if(confirm("Are you sure you want to dismiss this Issue? \n This operation can not be undone" )) {
			$.ajax({
			  type: "POST",
			  url: "/api/dismiss",
			  data: { ids: id }
			}).done(function( msg ) {
			 	location.assign('/view/issues');
			});
		}
	})

	$(".toggle-comment").click(function(e){
		var tg = $(e.currentTarget);
		var current = tg.data("ishidden");
		if(!current) current = false;
		var id = tg.data("id");
		var issueId = tg.data("issueid");
		console.log("Got command to toggle " + id + " which has a current of " + current);
		$.ajax({
		  type: "POST",
		  url: "/api/changeVisComment",
		  data: { hide: !current, issueId: issueId, id: id }
		}).done(function( msg ) {
		 	location.reload();
		});
	});
	$('.delete-comment').click(function(e){
		var tg = $(e.currentTarget);
		var id = tg.data("id");
		var issueId = tg.data("issueid");
		console.log('deleting issueId ' + issueId + " comment id " + id);
		if(confirm("Are you sure you want to dismiss this comment? \n This operation can not be undone" )) {
		
			$.ajax({
			  type: "POST",
			  url: "/api/deleteComment",
			  data: { issueId: issueId, id: id }
			}).done(function( msg ) {
			 	location.reload();
			});
		}
	});
});

function toggleVis(hide, ids) {
	$.ajax({
	  type: "POST",
	  url: "/api/changeVis",
	  data: { hide: hide, ids: ids }
	}).done(function( msg ) {
	 	location.reload();
	});
}

function getSelectedRows() {
	var id = "";
	$.each(dataTable.fnGetNodes(), function(i, obj){
		var check = $(obj).find('.check');
		if($(check).is(":checked")) {
			id += $(check).data('id') + ",";
		}
	});
	return id;
}