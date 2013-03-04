$(function() {
  soundManager.setup({
    url: '/swf/'
  });

  Artist = Backbone.Model.extend({
    type: 'artist',
    initialize: function() {
      this.filtered = false;
      if (!this.albums) {
        this.setupAlbums();
      }
    },

    parse: function(response) {
      if (response.albums) {
        this.setupAlbums(response.albums);
        delete response.albums;
      }
      return response;
    },

    setupAlbums: function(models) {
      this.albums = new AlbumList(models, {parse: true});
      this.albums.url = '/artists/' + this.id + '/albums';
      this.albums.artist = this;
    },

    queue: function(list) {
      if (!this.filtered) {
        this.albums.queue(list);
      }
    },

    filter: function(regexp) {
      var match = regexp.test(this.get('name'));
      if (match) {
        this.unfilter();
        this.trigger('filterhit');
      }
      else {
        this.albums.each(function(album) {
          var result = album.filter(regexp);
          if (!match) {
            match = result;
          }
        });

        if (match) {
          this.unfilter(true);
        }
        else {
          this.filtered = true;
          this.trigger('filtered');
        }
      }
      return(match);
    },

    unfilter: function(noPropagation) {
      if (this.filtered) {
        this.filtered = false;
        this.trigger('unfiltered');
      }
      if (!noPropagation) {
        this.albums.invoke('unfilter');
      }
    }
  });

  ArtistList = Backbone.Collection.extend({
    model: Artist,

    url: '/artists',

    comparator: function(artist) {
      return artist.get("name");
    },

    queue: function(list) {
      this.invoke('queue', list);
    },

    filter: function(regexp) {
      this.invoke('filter', regexp);
    },

    unfilter: function() {
      this.invoke('unfilter');
    }
  });

  Album = Backbone.Model.extend({
    type: 'album',

    initialize: function() {
      this.filtered = false;
      if (!this.tracks) {
        this.setupTracks();
      }
    },

    parse: function(response) {
      if (response.tracks) {
        this.setupTracks(response.tracks);
        delete response.tracks;
      }
      return response;
    },

    setupTracks: function(models) {
      this.tracks = new TrackList(models, {parse: true});
      this.tracks.url = '/albums/' + this.id + '/tracks';
      this.tracks.album = this;
    },

    queue: function(list) {
      if (!this.filtered) {
        this.tracks.queue(list);
      }
    },

    filter: function(regexp) {
      var match = regexp.test(this.get('name'));
      if (match) {
        this.unfilter();
        this.trigger('filterhit');
      }
      else {
        this.tracks.each(function(track) {
          var result = track.filter(regexp);
          if (!match) {
            match = result;
          }
        });

        if (match) {
          this.unfilter(true);
        }
        else {
          this.filtered = true;
          this.trigger('filtered');
        }
      }
      return(match);
    },

    unfilter: function(noPropagation) {
      if (this.filtered) {
        this.filtered = false;
        this.trigger('unfiltered');
      }
      if (!noPropagation) {
        this.tracks.invoke('unfilter');
      }
    }
  });

  AlbumList = Backbone.Collection.extend({
    model: Album,

    url: '/albums',

    comparator: function(album_1, album_2) {
      var year_1 = album_1.get('year');
      var year_2 = album_2.get('year');

      if (year_1 < year_2) {
        return -1;
      }
      if (year_1 > year_1) {
        return 1;
      }

      var name_1 = album_1.get('name');
      var name_2 = album_2.get('name');
      return name_1 < name_2 ? -1 : (name_1 == name_2 ? 0 : 1)
    },

    queue: function(list) {
      this.invoke('queue', list);
    }
  });

  Track = Backbone.Model.extend({
    type: 'track',

    initialize: function() {
      this.streamUrl = '/tracks/' + this.id + '/stream';
      this.filtered = false;
    },

    queue: function(list) {
      if (!this.filtered) {
        list.add(this);
      }
    },

    filter: function(regexp) {
      var match = regexp.test(this.get('name'));
      if (match) {
        this.unfilter();
        this.trigger('filterhit');
      }
      else {
        this.filtered = true;
        this.trigger('filtered');
      }
      return(match);
    },

    unfilter: function() {
      if (this.filtered) {
        this.filtered = false;
        this.trigger('unfiltered');
      }
    },

    initializeSound: function() {
      this.sound = soundManager.createSound({
        id: 'track-' + this.id,
        url: this.streamUrl,
        autoLoad: false,
        autoPlay: false,
        stream: true,
        volume: Track.volume,
        whileplaying: _.bind(this.tick, this),
        onplay: _.bind(this.trigger, this, 'play'),
        onpause: _.bind(this.trigger, this, 'pause'),
        onresume: _.bind(this.trigger, this, 'resume'),
        onstop: _.bind(this.trigger, this, 'stop'),
        onfinish: _.bind(this.finished, this)
      });
    },

    play: function() {
      if (!this.sound) {
        this.initializeSound();
      }
      this.sound.play();
    },

    pause: function() {
      if (this.sound) {
        this.sound.pause();
      }
    },

    resume: function() {
      if (this.sound) {
        this.sound.resume();
      }
    },

    stop: function() {
      if (this.sound) {
        this.sound.stop();
      }
    },

    kill: function() {
      this.destroySound();
      this.trigger('kill');
    },

    seek: function(position) {
      if (this.sound) {
        var positionCallback = _.bind(function(eventPosition) {
          this.sound.clearOnPosition(0, positionCallback);
          this.trigger('seek', position);
        }, this);
        this.sound.onPosition(0, positionCallback);
        this.sound.setPosition(position);
      }
    },

    setVolume: function(volume) {
      if (this.sound) {
        this.sound.setVolume(volume);
      }
    },

    tick: function() {
      this.trigger('tick', this.sound.position, this.sound.duration);
    },

    finished: function() {
      this.destroySound();
      this.trigger('finish');
    },

    destroySound: function() {
      if (this.sound) {
        this.sound.destruct();
        this.sound = null;
      }
    }
  });
  Track.volume = 60;

  TrackList = Backbone.Collection.extend({
    model: Track,
    url: '/tracks',
    comparator: function(track) {
      return track.get('number');
    },
    queue: function(list) {
      this.invoke('queue', list);
    }
  });

  TrackQueue = Backbone.Collection.extend({
    model: Track
  });
  PlaylistQueue = new TrackQueue;

  LibraryArtistView = Backbone.View.extend({
    tagName: "div",
    className: "artist closed",
    template: _.template($('#artist-template').html()),

    events: {
      'click > .top > .toggle': 'toggle'
    },

    initialize: function() {
      this.artist = this.model;
      this.albums = this.artist.albums;
      this.listenTo(this.artist, 'destroy', this.remove);
      this.listenTo(this.artist, 'filtered', this.filtered);
      this.listenTo(this.artist, 'unfiltered', this.unfiltered);
      this.listenTo(this.artist, 'filterhit', this.filterhit);
    },

    render: function() {
      this.$el.html(this.template(this.artist.toJSON()));
      this.$el.data('view', this);
      this.$el.draggable({
        revert: 'invalid',
        helper: _.bind(this.dragHelper, this),
        appendTo: 'body'
      });
      this.button = this.$('> .top > .toggle');
      this.button.button({
        icons: { primary: 'ui-icon-triangle-1-e' },
        text: false
      });
      this.addAlbums(this.albums);
      return this;
    },

    filtered: function() {
      this.$el.hide();
    },

    unfiltered: function() {
      this.$el.show();
    },

    filterhit: function() {
      this.toggle(false);
    },

    toggle: function() {
      var bool;
      if (arguments.length > 0 && typeof(arguments[0]) == 'boolean') {
        bool = arguments[0];
      }
      else {
        bool = this.$el.hasClass('closed');
      }

      if (bool) {
        this.$el.removeClass('closed');
        this.button.button('option', 'icons', {primary: 'ui-icon-triangle-1-s'});
      }
      else {
        this.$el.addClass('closed');
        this.button.button('option', 'icons', {primary: 'ui-icon-triangle-1-e'});
      }
    },

    addAlbum: function(album) {
      var view = new LibraryAlbumView({model: album});
      view.parent = this;
      this.$('.albums').append(view.render().el);
    },

    addAlbums: function() {
      this.albums.each(this.addAlbum, this);
    },

    dragHelper: function(e) {
      var result = $('<div class="artist-drag"></div>');
      result.html(this.model.get('name'));
      return(result);
    }
  });

  LibraryAlbumView = Backbone.View.extend({
    tagName: "div",
    className: "album closed",
    template: _.template($('#album-template').html()),

    events: {
      'click > .top > .toggle': 'toggle'
    },

    initialize: function() {
      this.album = this.model;
      this.tracks = this.album.tracks;
      this.listenTo(this.album, 'destroy', this.remove);
      this.listenTo(this.album, 'filtered', this.filtered);
      this.listenTo(this.album, 'unfiltered', this.unfiltered);
      this.listenTo(this.album, 'filterhit', this.filterhit);
    },

    render: function() {
      this.$el.html(this.template(this.album.toJSON()));
      this.$el.data('view', this);
      this.$el.draggable({
        revert: 'invalid',
        helper: _.bind(this.dragHelper, this),
        appendTo: 'body'
      });
      this.button = this.$('> .top > .toggle');
      this.button.button({
        icons: { primary: 'ui-icon-triangle-1-e' },
        text: false
      });
      this.addTracks(this.tracks);
      return this;
    },

    filtered: function() {
      this.$el.hide();
    },

    unfiltered: function() {
      this.$el.show();
    },

    filterhit: function() {
      if (this.parent) {
        this.parent.toggle(true);
      }
      this.toggle(false);
    },

    toggle: function() {
      var bool;
      if (arguments.length > 0 && typeof(arguments[0]) == 'boolean') {
        bool = arguments[0];
      }
      else {
        bool = this.$el.hasClass('closed');
      }

      if (bool) {
        this.$el.removeClass('closed');
        this.button.button('option', 'icons', {primary: 'ui-icon-triangle-1-s'});
        if (this.parent) {
          this.parent.toggle(true);
        }
      }
      else {
        this.$el.addClass('closed');
        this.button.button('option', 'icons', {primary: 'ui-icon-triangle-1-e'});
      }
    },

    addTrack: function(track) {
      var view = new LibraryTrackView({model: track});
      view.parent = this;
      this.$('.tracks').append(view.render().el);
    },

    addTracks: function() {
      this.tracks.each(this.addTrack, this);
    },

    dragHelper: function(e) {
      var result = $('<div class="album-drag"></div>');
      result.html(this.model.get('name'));
      return(result);
    }
  });

  LibraryTrackView = Backbone.View.extend({
    tagName: "div",
    className: "track",
    template: _.template($('#track-template').html()),

    initialize: function() {
      this.track = this.model;
      this.listenTo(this.track, 'destroy', this.remove);
      this.listenTo(this.track, 'filtered', this.filtered);
      this.listenTo(this.track, 'unfiltered', this.unfiltered);
      this.listenTo(this.track, 'filterhit', this.filterhit);
    },

    render: function() {
      this.$el.html(this.template(this.track.toJSON()));
      this.$el.data('view', this);
      this.$el.draggable({
        revert: 'invalid',
        helper: _.bind(this.dragHelper, this),
        appendTo: 'body'
      });
      return this;
    },

    filtered: function() {
      this.$el.hide();
    },

    unfiltered: function() {
      this.$el.show();
    },

    filterhit: function() {
      if (this.parent) {
        this.parent.toggle(true);
      }
    },

    dragHelper: function(e) {
      var result = $('<div class="track-drag"></div>');
      result.html(this.model.get('name'));
      return(result);
    }
  });

  LibraryView = Backbone.View.extend({
    el: '#library',

    events: {
      'keyup #filter': 'filterChanged'
    },

    initialize: function() {
      this.artists = new ArtistList;
      this.listenTo(this.artists, 'add', this.addArtist);
      this.listenTo(this.artists, 'reset', this.addArtists);

      this.$overlay = $('<div class="overlay"></div>').appendTo(this.$el);
      this.$spin = $('<div class="spin"></div>').appendTo(this.$overlay);
      this.spinner = new Spinner();
      this.spinner.spin(this.$spin.get(0));
      this.$progress = $('<div class="progress"></div>').
        appendTo(this.$overlay).progressbar();
      $.get('/discover/start', _.bind(this.discoverStarted, this), 'json');
    },

    discoverStarted: function() {
      setTimeout(_.bind(this.discoverStatus, this), 200);
    },

    discoverStatus: function() {
      $.get('/discover/status', _.bind(this.discoverUpdate, this), 'json');
    },

    discoverUpdate: function(data) {
      this.$progress.progressbar('option', 'max', data.num_files);
      this.$progress.progressbar('option', 'value', data.files_checked);
      if (data.status == 'finished') {
        this.fetchArtists(50, 0);
      }
      else {
        setTimeout(_.bind(this.discoverStatus, this), 200);
      }
    },

    fetchArtists: function(limit, offset) {
      this.artists.fetch({
        update: true,
        merge: false,
        remove: false,
        data: { 'all': 'true', 'limit': limit, 'offset': offset },
        success: _.bind(function(collection, response, options) {
          if (response.length == limit) {
            this.fetchArtists(limit, offset + limit);
          }
          else {
            /* Assume we're done. Yes, making an ass out of u and me. */
            this.spinner.stop();
            this.$overlay.remove();
          }
        }, this)
      });
    },

    filterChanged: function(e) {
      if (e.which == 8 || e.which >= 32) {
        this.filter(this.$('#filter').val());
      }
    },

    filter: function(pattern) {
      if (pattern == "") {
        this.artists.unfilter();
      }
      else {
        var re = new RegExp(pattern, "i");
        this.artists.filter(re);
      }
    },

    addArtist: function(artist) {
      var view = new LibraryArtistView({model: artist});
      this.$el.append(view.render().el);
    },

    addArtists: function() {
      this.artists.each(this.addArtist, this);
    }
  });
  Library = new LibraryView;

  PlaylistTrackView = Backbone.View.extend({
    tagName: "div",
    className: "track",
    template: _.template($('#playlist-track-template').html()),

    initialize: function() {
      this.track = this.model;
      this.listenTo(this.track, 'destroy', this.remove);
      this.listenTo(this.track, 'play', this.played);
      this.listenTo(this.track, 'pause', this.paused);
      this.listenTo(this.track, 'resume', this.resumed);
      this.listenTo(this.track, 'stop', this.stopped);
      this.listenTo(this.track, 'finish', this.finished);
      this.listenTo(this.track, 'kill', this.killed);
    },

    render: function() {
      var data = this.track.toJSON();
      data.album = this.track.collection.album.get('name');
      data.artist = this.track.collection.album.collection.artist.get('name');
      this.$el.html(this.template(data));
      this.$el.data('view', this);
      this.$('div:not(.clear)').attr('unselectable', 'on').
        css('user-select', 'none').on('selectstart', false);
      return this;
    },

    played: function() {
      this.$el.removeClass('stopped').addClass('playing');
    },

    paused: function() {
      this.$el.removeClass('playing').addClass('paused');
    },

    resumed: function() {
      this.$el.removeClass('paused').addClass('playing');
    },

    stopped: function() {
      this.$el.removeClass('playing paused').addClass('stopped');
    },

    finished: function() {
      this.$el.removeClass('playing paused stopped');
    },

    killed: function() {
      this.$el.removeClass('playing paused stopped');
    }
  });

  PlaylistView = Backbone.View.extend({
    el: '#playlist',

    events: {
      'drop': 'dropped',
      'sortupdate .tracks': 'finishSort',
      'sortstart .tracks': 'startSort',
      'dblclick .track': 'skip',
    },

    state: 'ready',

    position: 0,

    queue: PlaylistQueue,

    initialize: function() {
      this.trackViews = {};

      this.$el.droppable({
        accept: '#library .artist, #library .album, #library .track'
      });
      this.$('.tracks').
        sortable({handle: '.handle'}).
        selectable({filter: '.track', cancel: '.track :not(.check)'});

      this.listenTo(this.queue, 'add', this.addTrack);
      this.listenTo(this.queue, 'remove', this.removeTrack);
    },

    setState: function(newState) {
      this.previousState = this.state;
      this.state = newState;
    },

    dropped: function(e, ui) {
      var view = $(ui.draggable).data('view');
      var model = view.model;
      model.queue(this.queue);
    },

    startSort: function(e, ui) {
      this.originalIndex = ui.item.index();
    },

    finishSort: function(e, ui) {
      var newIndex = ui.item.index();
      if (this.originalIndex != newIndex) {
        var track = this.queue.at(this.originalIndex);
        this.queue.remove(track, {silent: true});
        this.queue.add(track, {silent: true, at: newIndex});
        if (this.position == this.originalIndex) {
          this.position = newIndex;
        }
      }
      delete this.originalIndex;
    },

    skip: function(e) {
      var el = $(e.target);
      if (!el.hasClass('track')) {
        el = el.closest('.track');
      }
      var view = el.data('view');
      var track = view.track;
      this.play(this.queue.indexOf(track) - this.position);
    },

    addTrack: function(track) {
      this.listenTo(track, 'play', this.trackPlayed);
      this.listenTo(track, 'pause', this.trackPaused);
      this.listenTo(track, 'resume', this.trackResumed);
      this.listenTo(track, 'stop', this.trackStopped);
      this.listenTo(track, 'tick', this.trackTicked);
      this.listenTo(track, 'seek', this.trackSeeked);
      this.listenTo(track, 'kill', this.trackKilled);

      var view = new PlaylistTrackView({model: track});
      this.$('.tracks').append(view.render().el);
      this.trackViews[track.id] = view;
    },

    removeTrack: function(track) {
      this.stopListening(track);
      this.trackViews[track.id].remove();
    },

    currentTrack: function() {
      return this.queue.at(this.position);
    },

    togglePlay: function() {
      if (this.state == 'playing') {
        this.pause();
      }
      else if (this.state == 'paused') {
        this.resume();
      }
      else if (this.state == 'stopped') {
        this.replay();
      }
      else {
        this.play();
      }
    },

    play: function(skip) {
      var track;

      if (this.state != 'ready') {
        track = this.currentTrack();
        track.kill();
      }
      if (typeof(skip) == 'number') {
        this.position += skip;
      }
      track = this.currentTrack();
      track.once('finish', _.partial(this.play, 1), this);
      track.play();
    },

    replay: function() {
      var track = this.currentTrack();
      track.play();
    },

    pause: function() {
      if (this.state == 'playing') {
        var track = this.currentTrack();
        track.pause();
      }
    },

    resume: function() {
      if (this.state == 'paused') {
        var track = this.currentTrack();
        track.resume();
      }
    },

    stop: function() {
      if (this.state == 'playing' || this.state == 'paused') {
        var track = this.currentTrack();
        track.stop();
      }
    },

    clear: function() {
      var track = this.currentTrack();
      if (track) {
        track.kill();
      }
      this.queue.update([]);
    },

    setVolume: function(volume) {
      var track = this.currentTrack();
      if (track) {
        track.setVolume(volume);
      }
      Track.volume = volume;
    },

    startSeek: function(e, ui) {
      if (this.state == 'playing') {
        var track = this.currentTrack();
        track.pause();
      }
    },

    finishSeek: function(e, ui) {
      var track = this.currentTrack();
      if (this.previousState == 'playing') {
        track.once('seek', this.resume, this);
        track.seek(ui.value);
      }
    },

    trackPlayed: function() {
      this.setState('playing');
      this.trigger('play');
    },

    trackPaused: function() {
      this.setState('paused');
      this.trigger('pause');
    },

    trackResumed: function() {
      this.setState('playing');
      this.trigger('resume');
    },

    trackStopped: function() {
      this.setState('stopped');
      this.trigger('stop');
    },

    trackTicked: function(position, duration) {
      this.trigger('tick', position, duration);
    },

    trackSeeked: function(position) {
      this.trigger('seek', position);
    },

    trackKilled: function() {
      this.state = 'ready';
      this.trigger('kill');
    }
  });
  Playlist = new PlaylistView;

  ControlsView = Backbone.View.extend({
    el: '#controls',

    playlist: Playlist,

    events: {
      'click .sweep': 'clear',
      'click .play': 'play',
      'click .stop': 'stop',
      'click .prev': 'prev',
      'click .next': 'next',
      'slide .volume': 'setVolume',
      'slide .seek': 'updateTimes'
    },

    initialize: function() {
      this.$('.sweep').button({
        icons: { primary: "ui-icon-trash" }, text: false
      });
      this.$('.prev').button({
        icons: { primary: "ui-icon-seek-first" }, text: false
      });
      this.$('.play').button({
        icons: { primary: "ui-icon-play" }, text: false
      });
      this.$('.stop').button({
        icons: { primary: "ui-icon-stop" }, text: false
      });
      this.$('.next').button({
        icons: { primary: "ui-icon-seek-end" }, text: false
      });
      this.$('.volume').slider({
        range: 'min', min: 0, max: 100, value: Track.volume
      });
      this.postime = this.$('.postime');
      this.seekSlider = this.$('.seek').slider({
        min: 0, max: 12345, range: "min",
        start: _.bind(this.playlist.startSeek, this.playlist),
        stop: _.bind(this.playlist.finishSeek, this.playlist)
      });
      this.negtime = this.$('.negtime');

      this.listenTo(this.playlist, 'play', this.played)
      this.listenTo(this.playlist, 'stop', this.stopped)
      this.listenTo(this.playlist, 'pause', this.paused)
      this.listenTo(this.playlist, 'resume', this.resumed)
      this.listenTo(this.playlist, 'tick', this.ticked)
      this.listenTo(this.playlist, 'kill', this.killed)
    },

    play: function() {
      this.playlist.togglePlay();
    },

    stop: function() {
      this.playlist.stop();
    },

    pause: function() {
      this.playlist.pause();
    },

    next: function() {
      this.playlist.play(1);
    },

    prev: function() {
      this.playlist.play(-1);
    },

    clear: function() {
      this.playlist.clear();
    },

    setVolume: function(e, ui) {
      this.playlist.setVolume(ui.value);
    },

    played: function() {
      this.setPlayIcon('pause');
    },

    stopped: function() {
      this.setPlayIcon('play');
      this.seekSlider.slider('option', 'value', 0);
    },

    paused: function() {
      this.setPlayIcon('play');
    },

    resumed: function() {
      this.setPlayIcon('pause');
    },

    ticked: function(position, duration) {
      this.postime.html(this.durationToTime(position));
      this.seekSlider.
        slider('option', 'max', duration).
        slider('value', position);
      this.negtime.html('-' + this.durationToTime(duration - position));
    },

    killed: function() {
      this.setPlayIcon('play');
      this.postime.html('');
      this.negtime.html('');
      this.seekSlider.slider('option', 'value', 0);
    },

    setPlayIcon: function(which) {
      this.$('.play').button('option', 'icons', {
        primary: 'ui-icon-' + which
      });
    },

    updateTimes: function(e, ui) {
      var position = this.seekSlider.slider('option', 'value');
      var duration = this.seekSlider.slider('option', 'max');
      this.postime.html(this.durationToTime(position));
      this.negtime.html('-' + this.durationToTime(duration - position));
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
  Controls = new ControlsView;
});
