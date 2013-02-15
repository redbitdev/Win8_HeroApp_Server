<script type="text/javascript" src="http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0"></script>
<script type="text/javascript" src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.2.min.js"></script>
<script type="text/javascript" src="PATH_TO_PLUGIN/jump.js"></script>
$('#map_canvas').jump({'credentials': 'AvOW5Fz4QTsubTTdmaVnseeZnAQ0JYwbx_6zdMdgHk6iF-pnoTE7vojUFJ1kXFTP', 'enableSearchLogo': false }, function() {
	var self = this;
	$.getJSON( YOUR_URL, function(response) {
		$.each( response.SOME_ARRAY, function(i, obj) {
			var location = new Microsoft.Maps.Location(obj.lat, obj.lng);
			self.addMarker({ 'location': location, 'bounds': true, 'title': obj.title } )
			.click(function() {
				self.openInfoWindow({ 
					'title': this.target.title //'GET THE PROPERTY BY this.target.YOUR_PROPERTY' 
				}, this);
			});
		});
	});
});

