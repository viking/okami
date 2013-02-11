(function($) {

var defaults = {
  searchHtml: '<div class="search">' +
    '<form>' +
      '<label for="search">Search:</label>' +
      '<input id="search" class="search" type="text" name="search" />' +
    '</form>' +
  '</div>',

  artistsUrl: '/artists',
  albumsUrl: '/albums',
  tracksUrl: '/tracks'
}

function sidebar(target, opts) {
  var self = this;
  this.target = $(target);
  var options = $.extend({}, defaults, opts);
  this.artistsUrl = options.artistsUrl;
  this.albumsUrl = options.albumsUrl;
  this.tracksUrl = options.tracksUrl;
  this.target.append(options.searchHtml);

  if ('artistsloaded' in options) {
    this.target.bind('artistsloaded', options.artistsloaded);
  }
  this.albumsloaded = options.albumsloaded;
  this.tracksloaded = options.tracksloaded;

  /* setup interaction */
  this.target.
    on('click', '.artist', function(e) {
      var artist = $(this);
      var albums = artist.next('.albums');
      if (albums.length == 0) {
        self.loadAlbums(artist);
      }
      else if (artist.hasClass('open')) {
        artist.removeClass('open').addClass('closed');
        albums.hide();
      }
      else {
        artist.removeClass('closed').addClass('open');
        albums.show();
      }
    }).
    on('click', '.album', function(e) {
      var album = $(this);
      var tracks = album.next('.tracks');
      if (tracks.length == 0) {
        self.loadTracks(album);
      }
      else if (album.hasClass('open')) {
        album.removeClass('open').addClass('closed');
        tracks.hide();
      }
      else {
        album.removeClass('closed').addClass('open');
        tracks.show();
      }
    }).
    on('click', '.track', function(e) {
    });

  this.loadArtists();
}

$.extend(sidebar.prototype, {
  loadArtists: function() {
    var self = this;
    $.get(this.artistsUrl, function(data) {
      self.target.append(data);
      if (self.albumsloaded) {
        self.target.find('.artist').bind('albumsloaded', self.albumsloaded);
      }
      self.target.trigger('artistsloaded');
    }, 'html');
  },

  loadAlbums: function(artistElt, includeTracks) {
    var self = this;
    var params = {artist_id: artistElt.data('id')};
    if (includeTracks) {
      params.tracks = 'true';
    }
    $.get(this.albumsUrl, params, function(data) {
      artistElt.after(data);
      artistElt.removeClass('closed').addClass('open');
      if (self.tracksloaded) {
        artistElt.find('.album').bind('tracksloaded', self.tracksloaded);
      }
      artistElt.trigger('albumsloaded');
    }, 'html');
  },

  loadTracks: function(albumElt) {
    $.get(this.tracksUrl, {album_id: albumElt.data('id')}, function(data) {
      albumElt.after(data);
      albumElt.removeClass('closed').addClass('open');
      albumElt.trigger('tracksloaded');
    }, 'html');
  }
});

$.fn.sidebar = function(method) {
  var obj = this.data('sidebar');
  if (!obj) {
    this.data('sidebar', new sidebar(this, arguments[0]));
  }
  else if (obj[method]) {
    return obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
  }
  else {
    $.error('Method ' + method + ' does not exist on sidebar object');
  }
}

})(jQuery);
