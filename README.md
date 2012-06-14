soundcloud-soundmanager-player
==============================

A custom, evented SoundCloud player that uses SoundManager2 to handle audio. Completely decoupled from your HTML/CSS to just handle audio/playlists/tracks, but has events that are easy to hook into. Also includes a waveform module that is loosely coupled to your HTML.


Requirements
------------

+ jQuery (>= 1.7 preferred for events 'on'|'off' syntax)
+ SoundManager2 (tested with V2.97a.20120527)



Basic Usage
===========

The most basic example is a single track (passed as array) and your consumer key (passed in the config object).
```js
var scplayer = new SoundCloudPlayer(
	[ "/diplo/wobble-prod-diplo"]
	, {consumer_key: "XXXXXXXXXXXXXX"}
);
```

You can also pass in multiple tracks to act as a playlist.
```js
var scplayer = new SoundCloudPlayer(
	[ "/diplo/wobble-prod-diplo"
	, "/diplo/sleigh-bells-demons-diplo"
	, "/abdecaf/feedyourbrain"
	]
	, {consumer_key: "XXXXXXXXXXXXXX"}
);
```



Options
-------

We can configure the player with many options. Most control the flow of the playlist. These are the defaults; located at near the top of the class.
```js
{ loop: false      //should the playlsit loop around on the ends
, autoplay: false  //should the play start out playing
, autoswitch: true //next track in playlist will auto load and play
, volume: 100      //the initial volume
, toggle_pause: true //should pause act as a toggle?
, cache: true      //should it cache the SC track lookups. Browser should handle the audio
}
```


Events
------

The player emits many events. Some are general to the player. Other are specific to the playlist or track. Most events will try to pass relevant data back to the listener. (eg: scplayer.volume returns with the set volume)

Player
+ scplayer.init
+ scplayer.play
+ scplayer.pause
+ scplayer.stop
+ scplayer.mute
+ scplayer.position
+ scplayer.volume
+ scplayer.changing_track

Playlist
+ scplayer.playlist.next
+ scplayer.playlist.looped
+ scplayer.playlist.ended
+ scplayer.playlist.prev
+ scplayer.playlist.looped
+ scplayer.playlist.restarted

Track
+ scplayer.track.info_loaded
+ scplayer.track.ready
+ scplayer.track.finished
+ scplayer.track.whileloading
+ scplayer.track.whileplaying
+ scplayer.track.played
+ scplayer.track.paused
+ scplayer.track.resumed
+ scplayer.track.stopped



Public Methods
--------------
The player exposes a lot of methods. They should be self explanatory.

Public methods
+ play()
+ pause()
+ stop()
+ next(autoplay)  //overrides the autoswitch config
+ prev(autoplay)  //overrides the autoswitch config
+ goto(index) //change track by playlist index
+ mute()
+ seek(position)
+ restart_track()
+ get_time()	  //gets the current time, based on position like m:ss. Pretty weak. Better roll your own with something like moment.js


Property Getter/Setter
+ volume(vol)
+ position(pos)

Event emiter/listener
+ on(eventname, function)
+ trigger(eventname, args...)

Internal object getter
+ track() (current track)	
+ sound() (the SM2 sound object for current track)
+ playlist() (same one you passed)



Chainable
---------
Most of the public player methods can be chained together

```js
scplayer.pause().next().play().volume(75);
```


Examples
========

Most of the time, you're going to call public methods and listen for events. -- more to come
```js
//new SC player
var scplayer = new SoundCloudPlayer(
	[ "/diplo/wobble-prod-diplo"
	, "/diplo/sleigh-bells-demons-diplo"
	, "/abdecaf/feedyourbrain"
	]
	, {consumer_key: "XXXXXXXXXXXXXX", autoplay: false, toggle_pause: true}
);
//clicking play
$('#playbtn').on('click', function(){
	//will work because of toggle_pause
	scplayer.pause();
});
//show pause status
scplayer.on('scplayer.pause', function(e, is_paused){
	if( is_paused === true ){
		$('#playbtn').addClass('paused');
	}else{
		$('#playbtn').removeClass('paused');
	}
});
//show playing progress
scplayer.on('scplayer.track.whileplaying', function(e, percent){
	$('.playhead').css('width', percent + '%');
	$('.track_time').text( scplayer.get_time() );
});
```





Waveform
========

Also included is a waveform module. It's just a wrapper for the most common setup for SC waveforms. It takes a player object, config options, and an override for the selectors.

Basic usage
-----------

This will get you a basic player and waveform. It's assuming a lot.
```js
//new SC player
var scplayer = new SoundCloudPlayer(
	[ "/diplo/wobble-prod-diplo"]
	, {consumer_key: "XXXXXXXXXXXXXX"}
);
//new waveform, passing the player
var scwaveform = new SCWaveform(scplayer);
```

Options
-------

There's only on option right now: Srubbing. It can be on, off, only clicking, or allow dragging. Dragging my be a little buggy.
```js
{ scrub: true  //can be true|false|'click'|'drag'
}
```

This is assuming some basic HTML structure.
```jade
#waveform
	.buffer
	.played
	img
```

Also a bit of css.
```less
#waveform {
	width: 100%;
	height: 200px;
	position: relative;

	.buffer, .played, > img { position:absolute; width: 0%; height:100%; }
	.buffer { background-color: hsla(180, 20%, 60%, .4);}
	.played { background-color: hsla(260, 20%, 60%, .4);}
	img {  width: 100%; }
}
```

But you can override the selectors. Takes either a css selector, dom element, or a jQuery object
```js
var scwaveform = new SCWaveform(scplayer, {scrub:true}, {
	  container: "#waveform"
	, buffer: $("#waveform").find('.buffer')
	, playbar: $("#waveform").find('.played')
	, waveform: $("#waveform").find('> img')
});
```


License
-------

This work is licensed under a Creative Commons Attribution 3.0 Unported License.
by [Keith Hoffmann][] based on a work at [github.com][].
![http://creativecommons.org/licenses/by/3.0/](http://i.creativecommons.org/l/by/3.0/88x31.png) http://creativecommons.org/licenses/by/3.0/

  [Keith Hoffmann]: http://www.eyesandearsentertainment.com
  [github.com]: https://github.com/kilokeith/soundcloud-soundmanager-player