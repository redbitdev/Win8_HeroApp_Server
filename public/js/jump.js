 /*!
 * jump.js 1.0 - Bing Maps
 * https://github.com/openlab/jump.js
 * Copyright (c) 2010 - 2012 Johan Säll Larsson
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */
( function($) {
	
	/**
	 * @param name:string
	 * @param version:string
	 * @param prototype:object
	 */
	$.a = function(name, version, prototype) {
		
		var namespace = name.split('.')[0];
        name = name.split('.')[1];
		
		$[namespace] = $[namespace] || {};
		$[namespace][name] = function(options, element, callback) {
			if ( arguments.length ) {
				this._setup(options, element, callback);
			}
		};
		
		$[namespace][name].prototype = $.extend({
			'namespace': namespace,
			'pluginName': name,
			'version': version
        }, prototype);
		
		$.fn[name] = function(options) {
			
			var isMethodCall = typeof options === "string",
				args = Array.prototype.slice.call(arguments, 1),
				returnValue = this;
			
			if ( isMethodCall && options.substring(0, 1) === '_' ) { 
				return returnValue; 
			}

			this.each(function() {
				var instance = $.data(this, name);
				if ( !instance ) {
					instance = $.data(this, name, new $[namespace][name](options, this, args));
				}
				if ( isMethodCall ) {
					var value = instance[options].apply(instance, args);
					if ( options === 'get' || value != null ) {
						returnValue = value;
					}
				}
			});
			
			return returnValue; 
			
		};
		
	};
	
	$.a('ui.jump', '1.0', {
		
		/**
		 * Map options
		 * @see http://msdn.microsoft.com/en-us/library/gg427603.aspx
		 */
		options: {
			'zoom': 5, 
			'credentials': Microsoft.Maps.Credentials
		},
		
		/**
		 * Get or set options
		 * @param key:string
		 * @param value:object
		 */
		option: function(key, value) {
			if ( value ) {
				this.options[key] = value;
				this.get('map').setOptions(this.options);
				return;
			}
			return this.options[key];
		},
		
		/**
		 * Setup plugin basics, 
		 * Set the jQuery UI Widget this.element, so extensions will work on both plugins
		 * @param options:object
		 * @param element:object
		 * @param callback:function() (optional)
		 * @see http://msdn.microsoft.com/en-us/library/gg427603.aspx
		 */
		_setup: function(options, element, callback) {
			this.el = element;
			this.$el = $(element);
			this.options = this._extend(this.options, options, { 'center': { 'callback': this._latLng } } );
			this._create(callback);
			if ( this._init ) {
				this._init();
			}
		},
		
		/**
		 * Create
		 * @param callback:function() (optional)
		 */
		_create: function(callback) {
			var self = this;
			this.instance = { map: new Microsoft.Maps.Map(this.el, this.options), markers: [], services: [], overlays: [] };
			if ( callback ) {
				this._call(callback[0], self.map);
			}
			setTimeout( function() { 
				if (self.el) { 
					$(self.el).trigger('init', self.map);
				} 
			}, 1);
		},
		
		/**
		 * Adds a latitude longitude pair to the bounds.
		 * @param latlng:Microsoft.Maps.Location/string
		 */
		addBounds: function(latlng) {
			var map = this.get('map'), bounds = this.get('bounds', []);
			bounds.push(this._latLng(latlng));
			if ( bounds.length > 1 ) {
				map.setView({ 'bounds': Microsoft.Maps.LocationRect.fromLocations(bounds) });
			} else {
				map.setView({ 'zoom': map.getZoomRange().max, 'center': bounds[0] })
			}
		},
		
		/**
		 * Adds a custom control to the map
		 * @param element:jquery/node/string	
		 * @param position:int	 
		 */
		addControl: function(element, position) {
			/*var map = this.get('map');
			var node = $(this._unwrap(element));
			var css = {'position': 'absolute', 'z-index': 10 };
			if ( position < 3 ) {
				css.top = 0;
			} else if ( position > 2 && position < 6 ) {
				css.top = ( map.getHeight() - node.height() ) / 2;
			} else if ( position > 5 ) {
				css.bottom = 0;
			}
			if ( position == 0 || position == 3 || position == 6 ) {
				css.left = 0;
			} else if ( position == 1 || position == 4 || position == 7 ) {
				css.left = ( map.getWidth() - node.width() ) / 2;
			} else if ( position == 2 || position == 5 || position == 8 ) {
				css.right = 0;
			}
			node.css(css);
			this.el.appendChild(node[0]);*/
			this.$el.append($(this._unwrap(element)).css({'position': 'absolute', 'z-index': 10 }));
		},
		
		/**
		 * Adds a Marker to the map
		 * @param pushpinOptions:Microsoft.Maps.PushpinOptions (optional)
		 * @param callback:function(Microsoft.Maps.Map, Microsoft.Maps.Pushpin) (optional)
		 * @return $(Microsoft.Maps.Pushpin)
		 * @see http://msdn.microsoft.com/en-us/library/gg427629.aspx
		 */
		addMarker: function(pushpinOptions, callback) {
			var map = this.get('map');
			pushpinOptions = this._extend({}, pushpinOptions, { 'position': 'location' });	
			var marker = this._extend(new (pushpinOptions.marker || Microsoft.Maps.Pushpin)(this._latLng(pushpinOptions.location), pushpinOptions), pushpinOptions);
			var markers = this.get('markers', []);
			if ( marker.id ) {
				markers[marker.id] = marker;
			} else {
				markers.push(marker);
			}
			if ( pushpinOptions.bounds ) {
				this.addBounds(marker.getLocation());
			}
			map.entities.push(marker);
			this._call(callback, map, marker);
			return $(marker);
		},
		
		/**
		 * Triggers an InfoWindow to open
		 * @param infoboxOptions:Microsoft.Maps.InfoboxOptions
		 * @param pushpin:Microsoft.Maps.Pushpin (optional)
		 * @param callback:function (optional)
		 * @see http://msdn.microsoft.com/en-us/library/gg675210.aspx
		 */
		openInfoWindow: function(infoboxOptions, pushpin, callback) {
			var map = this.get('map');
			var infobox = this.get('iw'); 
			infoboxOptions = this._extend({ 
				'offset': new Microsoft.Maps.Point(0, 15), 
				'showPointer': true, 
				'zIndex': 100, 
				'visible': true
			}, infoboxOptions, {  
				'position': { 'replace': 'location', 'callback': this._latLng }, 
				'pixelOffset': 'offset', 
				'maxWidth': 'width' 
			});
			infoboxOptions.location = infoboxOptions.location || ( pushpin.target ) ? pushpin.target.getLocation() : pushpin.getLocation();
			if ( infoboxOptions.content ) {
				infoboxOptions.description = ( this._unwrap(infoboxOptions.content, true) ) ? this._unwrap(infoboxOptions.content).innerHTML : infoboxOptions.content;
			}
			if ( infobox && map.entities.indexOf(infobox) > -1 ) {
				map.entities.remove(this.get('iw'));
			}
			
			infobox = new ( infoboxOptions.infoWindow || Microsoft.Maps.Infobox )(infoboxOptions.location, infoboxOptions);
			map.entities.push(infobox);
			this.set('iw', infobox);
			
			if ( !infoboxOptions.disableAutoPan ) {
				var height = map.getHeight() - ( infobox.getHeight() + Math.abs(infobox.getOffset().y) ), 
					width = map.getWidth() - ( infobox.getWidth() + Math.abs(infobox.getOffset().x) );
				if ( height > 0 && width > 0 ) {
					var px = map.tryLocationToPixel(infoboxOptions.location);
					infoboxOptions.location = map.tryPixelToLocation({ 
						'x': px.x + ( infobox.getWidth() / 2 ) + infobox.getOffset().x - ( (!infoboxOptions.htmlContent) ? 40 : 0 ), 
						'y': px.y - ( infobox.getHeight() / 2 ) - infobox.getOffset().y - ( (infoboxOptions.showPointer && !infoboxOptions.htmlContent) ? 40 : 0 ), 
						'z': px.z 
					});
				}
				map.setView({ 'center': infoboxOptions.location });
			}
			
			this._call(callback, infobox);
		},
		
		/**
		 * Triggers an InfoWindow to close
		 */
		closeInfoWindow: function() {
			if ( this.get('iw') ) {
				this.get('iw').setOptions({ 'visible': false });
			}
		},
		
		/**
		 * Clears by type
		 * @param type:string i.e. markers, overlays, services
		 */
		clear: function(type) {
			this._clear(this.get(type));
			this.set(type, []);
		},
		
		/**
		 * Clears arrays
		 * @param obj:array
		 */
		_clear: function(obj) {
			for ( var property in obj ) {
				if ( obj.hasOwnProperty(property) ) {
					if ( obj[property] instanceof Microsoft.Maps.Pushpin || obj[property] instanceof Microsoft.Maps.Infobox || obj[property] instanceof Microsoft.Maps.Map ) {
						Microsoft.Maps.Events.removeHandler(obj[property]);
						this.get('map').entities.remove(obj[property]);
					} else if ( obj[property] instanceof Array ) {
						this._clear(obj[property]);
					}
					obj[property] = null;
				}
			}
		},
		
		/**
		 * Returns the objects with a specific property and value, e.g. 'category', 'tags'
		 * @param ctx:string	in what context, e.g. 'markers' 
		 * @param options:object	property:string	the property to search within, value:string, operator:string (optional) (AND/OR)
		 * @param ccallback:function(Microsoft.Maps.Pushpin, isFound:boolean)
		 */
		find: function(ctx, options, callback) {
			var obj = this.get(ctx);
			options.value = $.isArray(options.value) ? options.value : [options.value];
			for ( var property in obj ) {
				if ( obj.hasOwnProperty(property) ) {
					var isFound = false;
					for ( var value in options.value ) {
						if ( $.inArray(options.value[value], obj[property][options.property]) > -1 ) {
							isFound = true;
						} else {
							if ( options.operator && options.operator === 'AND' ) {
								isFound = false;
								break;
							}
						}
					}
					callback(obj[property], isFound);
				}
			}
		},
		
		/**
		 * Helper function to check if a LatLng is within the viewport
		 * @param marker:Microsoft.Maps.Pushpin
		 */
		inViewport: function(marker) {
			return this.get('map').getBounds().contains(marker.getLocation());
		},

		/**
		 * Returns an instance property by key. Has the ability to set an object if the property does not exist
		 * @param key:string
		 * @param value:object(optional)
		 */
		get: function(key, value) {
			var instance = this.instance;
			if (!instance[key]) {
				if ( key.indexOf('>') > -1 ) {
					var array = key.replace(/ /g, '').split('>');
					for ( var i = 0; i < array.length; i++ ) {
						if ( !instance[array[i]] ) {
							if (value) {
								instance[array[i]] = ( (i + 1) < array.length ) ? [] : value;
							} else {
								return null;
							}
						}
						instance = instance[array[i]];
					}
					return instance;
				} else if ( value && !instance[key] ) {
					this.set(key, value);
				}
			}
			return instance[key];
		},
		
		/**
		 * Sets an instance property
		 * @param key:string
		 * @param value:object
		 */
		set: function(key, value) {
			this.instance[key] = value;
		},
		
		/**
		 * Destroys the plugin.
		 */
		destroy: function() {
			this.clear('markers');
			this.clear('services');
			this.clear('overlays');
			this._clear(this.instance);
			$.removeData(this.el, this.name);
		},
		
		/**
		 * Helper method for calling a function
		 * @param callback
		 */
		_call: function(callback) {
			if ( callback && $.isFunction(callback) ) {
				callback.apply(this, Array.prototype.slice.call(arguments, 1));
			}
		},
		
		/**
		 * Helper method for Microsoft.Maps.Location
		 * @param latlng:string/Microsoft.Maps.Location
		 */
		_latLng: function(latLng) {
			if ( !latLng ) {
				return new Microsoft.Maps.Location(0.0, 0.0);
			}
			if ( latLng instanceof Microsoft.Maps.Location ) {
				return latLng;
			} else if ( typeof latLng === 'string' ) {
				latLng = latLng.replace(/ /g,'').split(',');
				return new Microsoft.Maps.Location(latLng[0], latLng[1]);
			} else if ( $.isArray(latLng) ) {
				for ( var i = 0; i < latLng.length; i++ ) {
					latLng[i] = this._latLng(latLng[i]);
				}
				return latLng;
			}
		},
		
		/**
		 * Helper method for unwrapping jQuery/DOM/string elements
		 * @param obj:string/node/jQuery
		 * @param isObject:boolean
		 */
		_unwrap: function(obj, isObject) {
			if ( !obj ) {
				return null;
			} else if ( obj instanceof $ ) {
				return obj[0];
			} else if ( obj instanceof Object ) {
				return obj;
			} else if ( obj.indexOf('#') > 0 || obj.indexOf('.') > 0 ) {
				return $('#'+obj)[0];
			} else {
				return ( !isObject ) ? document.getElementById(obj) : null;
			}
		},
		
		/**
		 * Helper method for extending an object
		 * @param defaults:object
		 * @param option:object
		 * @param replace:object
		 */
		_extend: function(defaults, options, replace) { 
			for ( var key in options ) {
				if ( replace && replace[key] ) {
					replace = replace[key];
					if ( typeof replace === 'string' ) {
						defaults[replace] = options[key];
					} else {
						var rkey = ( replace.replace ) ? replace.replace : key;
						defaults[rkey] = (replace.callback) ? replace.callback(options[key]) : options[key];
					}
				} else {
					defaults[key] = options[key];
				}
			}
			return defaults;
		}
		
	});
	
	$.fn.extend( {
			
		triggerEvent: function(eventType) {
			Microsoft.Maps.Events.invoke(this[0], eventType);		
		},

		addEventListener: function(eventType, eventDataOrCallback, eventCallback) {
			if ( this[0] instanceof Microsoft.Maps.Pushpin || this[0] instanceof Microsoft.Maps.Infobox || this[0] instanceof Microsoft.Maps.Map ) {
				Microsoft.Maps.Events.addHandler(this[0], eventType, eventDataOrCallback);
			} else {
				if (eventCallback) {
					this.bind(eventType, eventDataOrCallback, eventCallback);
				} else {
					this.bind(eventType, eventDataOrCallback);
				}	
			}
			return this;
		}
		
	});
	
	$.each(('click rightclick dblclick mouseover mouseout drag dragend').split(' '), function(i, name) {
		$.fn[name] = function(a, b) {
			return this.addEventListener(name, a, b);
		}
	});
			
} (jQuery) );