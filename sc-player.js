//object slice
__slice = [].slice;


//set the default options for SM2
soundManager.url = 'swf/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;


/* SCPLAYER EVENTS */
/*
	scplayer.init
	scplayer.play
	scplayer.pause
	scplayer.stop
	scplayer.mute
	scplayer.position
	scplayer.volume

*/
/* SCPLAYER PLAYLIST EVENTS */
/*
	scplayer.playlist.next
	scplayer.playlist.looped
	scplayer.playlist.ended
	scplayer.playlist.prev
	scplayer.playlist.looped
	scplayer.playlist.restarted

*/
/* SCPLAYER TRACK EVENTS */
/*
	scplayer.track.info_loaded
	scplayer.track.ready
	scplayer.track.finished
	scplayer.track.whileloading
	scplayer.track.whileplaying
	scplayer.track.played
	scplayer.track.paused
	scplayer.track.resumed
	scplayer.track.stopped
*/

//SoudCloud Player class
var SoundCloudPlayer = function(tracks, config){
	var defaults = {
		  loop: false
		, autoplay: false
		, autoswitch: true //for playlists
		, volume: 100
		, toggle_pause: true //should pause act as a toggle?
		, cache: true //caches the SC track lookup. Browser should handle the audio
	}, 
	sc_resolve_url = "http://api.soundcloud.com/resolve?url=http://soundcloud.com";
	
	
	//keep ref to local scope
	var _this = this, $this = $(this);
	
	//local vars
	this.tracks = tracks;
	this.config = $.extend(defaults, config);
	this.current_track_index = 0;
	this.current_track = null;
	this.sound = null;
	//hold a state so when you hit play it'll play on the correct sound when it's ready
	this.play_when_ready = false;
	//hold a cache for SC lookups
	this.cache = {};
	
	//setup
	this.init = function(){		
		_this.change_track();
		_this.trigger('scplayer.init');
		if(_this.config.autoplay) _this.play();
	};
	
	//load a track form a trimmed SC url
	this.change_track = function(index){
		//destroy the old sound
		if(_this.sound){
			_this.sound.destruct();
			_this.sound = null;
		}
		
		
		var i = (typeof index != 'undefined' )? index : _this.current_track_index;
		if( index != _this.current_track_index || !index){
			var url = _this.tracks[i];
			_this.resolve_track(url, _this.set_sound);
			_this.trigger('scplayer.changing_track', index);
		}
		return _this;
	}
	
	
	/* ---- public methods ---- */
	
	//playlist related methods
	this.play = function(){
		//if the sound it there and ready, get to it
		if( _this.sound && _this.sound.readyState == 3 ){
			_this.sound.play();
		}else{
			//or hold a state to come back to when ready
			_this.play_when_ready = true;
		}
		_this.trigger('scplayer.play');
		
		return _this;
	};
	this.pause = function(){
		if(_this.sound){
			if(_this.config.toggle_pause) _this.sound.togglePause();
			else _this.sound.pause();
			_this.trigger('scplayer.pause', _this.sound.paused);
		}
		return _this;
	};
	this.stop = function(){
		if(_this.sound) _this.sound.stop();
		_this.trigger('scplayer.stop');
		return _this;
	};
	this.next = function(autoplay){
		//play the next track?
		_this.play_when_ready = (typeof autoplay != 'undefined')? autoplay : _this.config.autoswitch;
		console.log(_this.play_when_ready);
		
		if( _this.tracks[ _this.current_track_index+1 ] ){
			_this.current_track_index++;
			_this.change_track();
			_this.trigger('scplayer.playlist.next', _this.current_track_index-1, _this.current_track_index);
		}else if( _this.config.loop ){
			_this.current_track_index = 0;
			_this.change_track();
			_this.trigger('scplayer.playlist.looped');
		}else{
			_this.current_track_index = _this.tracks.length-1
			_this.trigger('scplayer.playlist.ended');
		}
		return _this;
	};
	this.prev = function(autoplay){
		//play the next track?
		_this.play_when_ready = (typeof autoplay != 'undefined')? autoplay : _this.config.autoswitch;
		
		if( _this.tracks[ _this.current_track_index-1 ] ){
			_this.current_track_index--;
			_this.change_track();
			_this.trigger('scplayer.playlist.prev');
		}else if( _this.config.loop ){
			_this.current_track_index = _this.tracks.length-1;
			_this.change_track();
			_this.trigger('scplayer.playlist.looped');
		}else{
			_this.current_track_index = 0;
			_this.trigger('scplayer.playlist.restarted');
		}
		return _this;
	};
	
	
	//sound related methods
	this.restart_track = function(){
		_this.position(0);
		return _this;
	};
	this.mute = function(){
		if(_this.sound) _this.sound.toggleMute();
		_this.trigger('scplayer.mute', _this.sound.muted);
		return _this;
	};
	this.position = function(pos){
		if(_this.sound){
			if(pos){
				//limit to bounds
				pos = Math.min(_this.sound.duration, pos);
				pos = Math.max(0, pos);
				//setter
				_this.trigger('scplayer.position', pos);
				return _this.sound.setPosition(pos);
			}else{
				//getter
				_this.trigger('scplayer.position', _this.sound.position);
				return _this.sound.position;
			}
		}
		
		return 0;
	};
	this.volume = function(vol){
		if(_this.sound){
			if(vol){
				//limit to bounds
				vol = Math.min(100, vol);
				vol = Math.max(0, vol);
				//setter
				_this.trigger('scplayer.volume', vol);
				return _this.sound.setVolume(vol);
			}else{
				//getter
				_this.trigger('scplayer.volume', _this.sound.volume);
				return _this.sound.volume;
			}
		}
		
		return _this.config.volume;
	};
	//seeking
	this.seek = function(relative){
		// Calculate a new position given the click's relative position and the track's duration.
		var pos = _this.current_track.duration * relative;
		_this.position(pos);
		return _this;
	};
	
	//events - using jquery
	this.on = function(evnt, cb){
		return $this.on(evnt, cb);
	};
	this.trigger = function(evnt){
		var args = (arguments.length > 1) ? __slice.call(arguments, 1) : [];
		return $this.trigger(evnt, args);
	};
	
	
	/* ---- private methods ---- */
	_this.get_track = function(){ return _this.current_track; };
	_this.get_sound = function(){ return _this.sound; };
	_this.get_playlist = function(){ return _this.playlist; };
	
	_this.set_cache = function(url, track){
		if(_this.config.cache === true){
			_this.cache[url] = track;
		}
	};
	_this.get_cache = function(url){
		if(_this.config.cache === true){
			return _this.cache[url] || null;
		}
		return null;
	};
	_this.set_sound = function(track){
		//
		_this.trigger('scplayer.track.info_loaded', track);
		//store the current track object
		_this.current_track = track;
		//get a SC url
		var url = track.stream_url;
		url += (url.indexOf("secret_token") == -1) ? '?' : '&';
		url += 'consumer_key=' + _this.config.consumer_key;
		
		//
		//setup the SM2 sound object
		_this.sound = soundManager.createSound({
			  autoLoad: true
			, id: 'track_' + track.id
			, multiShot: false
			, url: url
			, volume: _this.config.volume
			, whileloading: function() {
				//only whole number percents
				var percent = Math.round(this.bytesLoaded / this.bytesTotal * 100);
				_this.trigger('scplayer.track.whileloading', percent);
			}
			, whileplaying: function() {
				//round to nearest 10th of a percent for performance
				var percent = Math.round(this.position / track.duration * 100 * 10) / 10;
				_this.trigger('scplayer.track.whileplaying', percent);
			}
			, onplay: function() {
				console.log('playyyyy');
				_this.trigger('scplayer.track.played');
			}
			, onresume: function() {
				_this.trigger('scplayer.track.resumed');
			}
			, onstop: function() {
				_this.trigger('scplayer.track.stopped');	
			}
			, onpause: function() {
				_this.trigger('scplayer.track.paused');
			}
			, onfinish: function() { 
				_this.trigger('scplayer.track.finished');
			}
			, onload: function() {
				console.log('onload');
				_this.trigger('scplayer.track.ready', _this.current_track_index, _this.current_track);
			}
		});
		
	};
	
	//gets a SC url and goes to SC to fetch the track data
	_this.resolve_track = function(url, cb){
		//if we're cahcing check cache first
		if( _this.config.cache === true ){
			var track = _this.get_cache(url);
			if(track && cb) return cb(track);
		}
		
		$.getJSON(sc_resolve_url+url+
			'&format=json'+
			'&consumer_key='+_this.config.consumer_key+
			'&callback=?'
			, function(_track){
				//maybe cache the track
				if( _this.config.cache === true ) _this.set_cache(url, _track);
				if(cb) cb(_track);
			});
	};
	
	/* internal events */
	_this.on('scplayer.track.ready', function(e){
		//console.log('scplayer.ready', _this.play_when_ready, _this.sound.playState);
		if( _this.play_when_ready == true ){
			_this.play();
			_this.play_when_ready = false;
		}
	});
	_this.on('scplayer.track.finished', function(e){
		if(_this.config.autoswitch) _this.next().play();
	});
	
	
	
	//init everything when we're sure SM2 has loaded
	soundManager.onready(function() {
		_this.init.call(_this);
	});
	
	//expose only the public methods
	return {
		  play: 		this.play
		, pause: 		this.pause
		, stop: 		this.stop
		, next: 		this.next
		, prev: 		this.prev
		, mute: 		this.mute
		, volume: 		this.volume
		, restart_track: this.restart_track
		, change_track: this.change_track
		, position: 	this.position
		, seek: 		this.seek
		, on: 			this.on
		, trigger: 		this.trigger
		, track: 		this.get_track 		//expose the current track playing
		, sound: 		this.get_sound 		//expose the current SM2 object
		, playlist: 	this.get_playlist 	//expose the playlist
	};
};