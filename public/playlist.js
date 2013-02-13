/* requires mustache, soundmanager 2 */

(function($) {

var defaults = {
  headerHtml: '<div class="header">' +
      '<div class="handle"></div>' +
      '<div class="number">#</div>' +
      '<div class="title">Title</div>' +
      '<div class="album">Album</div>' +
      '<div class="artist">Artist</div>' +
      '<div class="clear"></div>' +
    '</div>',

  controlsHtml: '<div class="buttons">' +
      '<button class="sweep">Clear</button>' +
      '<button class="prev">Previous</button>' +
      '<button class="play">Play</button>' +
      '<button class="stop">Stop</button>' +
      '<button class="next">Next</button>' +
    '</div>' +
    '<div class="playback">' +
      '<div class="postime"></div>' +
      '<div class="seek"></div>' +
      '<div class="negtime"></div>' +
      '<div class="clear"></div>' +
    '</div>',

  trackTemplate: '<div class="track track-{{id}}" data-id="{{id}}" data-url="{{url}}">' +
      '<div class="handle"></div>' +
      '<div class="number">{{number}}</div>' +
      '<div class="title">{{title}}</div>' +
      '<div class="album">{{album}}</div>' +
      '<div class="artist">{{artist}}</div>' +
      '<div class="clear"></div>' +
    '</div>',

  position: -1
};

function playlist(target, opts) {
  var self = this;
  this.target = $(target);

  var options = $.extend({}, defaults, opts);
  this.target.append(options.headerHtml);
  this.tracks = $('<div class="tracks"></div>');
  this.target.append(this.tracks);
  this.tracks.
    sortable({handle: '.handle'}).
    selectable({cancel: '.ui-selected'}).
    on('dblclick', '.track.ui-selected', function(e) {
      var dblclicks = $(this).data('dblclicks');
      if (typeof(dblclicks) == 'undefined') {
        dblclicks = 0;
      }
      $(this).data('dblclicks', dblclicks + 1);

      var pos = self.tracks.find('.track').index(this);
      if (pos > -1) {
        self.skipTo(pos);
      }
    }).on('click', '.track.ui-selected', function(e) {
      var obj = $(this);
      setTimeout(function() {
        var dblclicks = obj.data('dblclicks');
        if (dblclicks > 0) {
          obj.data('dblclicks', dblclicks - 1);
        }
        else {
          obj.removeClass('ui-selected').parents('.ui-selectable').
            trigger('selectableunselected');
        }
      }, 150);
    });

  this.controls = $('<div class="controls"></div>');
  this.controls.append(options.controlsHtml);
  this.target.after(this.controls);
  this.controls.find('.sweep').button({
    icons: { primary: "ui-icon-trash" }, text: false
  }).click(function(e) {
    self.clear.call(self);
  });
  this.controls.find('.prev').button({
    icons: { primary: "ui-icon-seek-first" }, text: false
  }).click(function(e) {
    self.prev.call(self);
  });
  this.controls.find('.play').button({
    icons: { primary: "ui-icon-play" }, text: false
  }).click(function(e) {
    self.play.call(self);
  });
  this.controls.find('.stop').button({
    icons: { primary: "ui-icon-stop" }, text: false
  }).click(function(e) {
    self.stop.call(self);
  });
  this.controls.find('.next').button({
    icons: { primary: "ui-icon-seek-end" }, text: false
  }).click(function(e) {
    self.next.call(self);
  });
  this.postime = this.controls.find('.postime');
  this.seek = this.controls.find('.seek').slider({
    min: 0, max: 1000, range: "min"
  });
  this.negtime = this.controls.find('.negtime');

  this.trackTemplate = Mustache.compile(options.trackTemplate);
  this.position = options.position;
  this.state = 'empty';
  this.currentSound = null;
}

$.extend(playlist.prototype, {
  append: function(track) {
    if (this.state == 'empty') {
      this.setState('ready');
    }
    var track = $(this.trackTemplate(track));
    track.find('div:not(.clear)').attr('unselectable', 'on').
      css('user-select', 'none').on('selectstart', false);
    this.tracks.append(track);
  },

  trackAt: function(position) {
    return(this.tracks.find('.track:eq('+position+')'));
  },

  count: function() {
    return(this.tracks.find('.track').length);
  },

  clear: function() {
    if (this.state == 'playing' || this.state == 'stopped' || this.state == 'paused') {
      this.deleteSound();
    }
    this.tracks.html('');
    this.position = -1;
    this.setState('empty');
  },

  prev: function() {
    if (this.position > 0) {
      this.deleteSound();
      this.position--;
      this.loadSound();
    }
  },

  play: function() {
    if (this.state == 'empty')
      return;

    if (this.state == 'ready') {
      this.position++;
      this.loadSound();
    }
    else if (this.state == 'playing') {
      this.pauseSound();
    }
    else if (this.state == 'paused') {
      this.resumeSound();
    }
    else if (this.state == 'stopped') {
      this.playSound(this.currentSound);
    }
  },

  stop: function() {
    if (this.state == 'playing' || this.state == 'paused') {
      this.stopSound();
    }
  },

  next: function() {
    if (this.position < (this.count() - 1)) {
      this.deleteSound();
      this.position++;
      this.loadSound();
    }
  },

  skipTo: function(position) {
    this.deleteSound();
    this.position = position;
    this.loadSound();
  },

  setState: function(newState) {
    if (this.state == 'playing' && newState != 'playing') {
      this.controls.find('.play').button('option', 'icons', {
        primary: 'ui-icon-play'
      });
    }
    else if (newState == 'playing') {
      this.controls.find('.play').button('option', 'icons', {
        primary: 'ui-icon-pause'
      });
    }
    this.state = newState;
  },

  loadSound: function() {
    var track = this.trackAt(this.position);
    if (track.length == 0)
      return;

    var self = this;
    soundManager.createSound({
      id: 'track-' + track.data('id'),
      url: track.data('url'),
      autoLoad: true,
      volume: 50,
      onload: function() {
        var duration = this.duration;
        self.postime.html('0:00');
        self.seek.slider('option', 'max', duration);
        self.negtime.html('-' + self.durationToTime(duration));
        self.playSound.call(self, this);
      },
      whileplaying: function() {
        var position = this.position;
        var duration = this.duration;
        self.postime.html(self.durationToTime(position));
        self.seek.slider('value', position);
        self.negtime.html('-' + self.durationToTime(duration - position));
      }
    });
  },

  playSound: function(sound) {
    this.currentSound = sound;
    var self = this;
    sound.play({
      onfinish: function() {
        self.soundFinished.call(self, this);
      }
    });
    this.trackAt(this.position).removeClass('stopped').addClass('playing');
    this.setState('playing');
  },

  pauseSound: function() {
    this.currentSound.pause();
    this.controls.find('.play').button('option', 'icons', {
      primary: 'ui-icon-play'
    });
    this.trackAt(this.position).removeClass('playing').addClass('paused');
    this.setState('paused');
  },

  resumeSound: function() {
    this.currentSound.resume();
    this.controls.find('.play').button('option', 'icons', {
      primary: 'ui-icon-pause'
    });
    this.trackAt(this.position).removeClass('paused').addClass('playing');
    this.setState('playing');
  },

  stopSound: function() {
    this.currentSound.stop();
    this.trackAt(this.position).removeClass('playing paused').addClass('stopped');
    this.postime.html('0:00');
    this.seek.slider('value', 0);
    this.negtime.html('-' + this.durationToTime(this.currentSound.duration));
    this.setState('stopped');
  },

  deleteSound: function() {
    if (this.currentSound) {
      if (this.currentSound.playState) {
        this.currentSound.stop();
      }
      this.currentSound.destruct();
      this.currentSound = null;
      this.trackAt(this.position).removeClass('playing paused stopped');
      this.postime.html('');
      this.seek.slider('value', 0);
      this.negtime.html('');
    }
    this.setState('ready');
  },

  soundFinished: function(sound) {
    this.deleteSound();
    this.position++;
    if (this.position == this.count()) {
      // end of playlist
      this.position = -1;
    }
    else {
      this.loadSound();
    }
  },

  durationToTime: function(duration) {
    var totalSeconds = Math.round(duration / 1000);
    var seconds = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var minutes = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);

    var result = '';
    if (hours > 0) {
      result += hours + ':';
      if (minutes < 10) {
        result += '0';
      }
    }
    result += minutes + ':';
    if (seconds < 10) {
      result += '0'
    }
    result += seconds;
    return(result);
  }
});

$.fn.playlist = function(method) {
  var obj = this.data('playlist');
  if (!obj) {
    this.data('playlist', new playlist(this, arguments[0]));
  }
  else if (obj[method]) {
    return obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
  }
  else {
    $.error('Method ' + method + ' does not exist on playlist object');
  }
}

})(jQuery);
