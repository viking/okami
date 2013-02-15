(function($) {

var defaults = {
  template: '<div class="artists">' +
    '{{#artists}}' +
      '<div class="artist artist-{{id}} closed" data-id="{{id}}" data-name="{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}">{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}</div>' +
      '<div class="albums artist-{{id}}" style="display: none;">' +
      '{{#albums}}' +
        '<div class="album album-{{id}} artist-{{artist_id}} closed" data-id="{{id}}" data-year="{{year}}" data-name="{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}" data-artist_id="{{artist_id}}">' +
          '{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}' +
        '</div>' +
        '<div class="tracks album-{{id}}" style="display: none;">' +
        '{{#tracks}}' +
          '<div class="track track-{{id}} album-{{album_id}} artist-{{artist_id}}" data-id="{{id}}" data-number="{{number}}" data-name="{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}" data-artist_id="{{artist_id}}" data-album_id="{{album_id}}">{{#name}}{{name}}{{/name}}{{^name}}Unknown{{/name}}</div>' +
        '{{/tracks}}' +
        '</div>' +
      '{{/albums}}' +
      '</div>' +
    '{{/artists}}' +
    '</div>',

  searchHtml: '<div class="search">' +
    '<form>' +
      '<label for="search">Search:</label>' +
      '<input id="search" class="search" type="text" name="search" />' +
    '</form>' +
  '</div>',

  url: '/library'
}

function library(target, opts) {
  var self = this;
  this.target = $(target);
  var options = $.extend({}, defaults, opts);
  this.url = options.url;
  this.template = options.template;
  this.data = {};
  this.index = {};

  this.target.append(options.searchHtml);
  this.search = this.target.find('input.search');
  this.target.append('<div class="library"></div>');
  this.library = this.target.find('.library');

  if ('loaded' in options) {
    this.target.bind('loaded', options.loaded);
  }

  /* setup interaction */
  this.target.on('click', '.artist, .album', function(e) {
    self.toggleNode.call(self, $(this));
  });

  /* setup search */
  this.search.keyup(function(e) {
    if (e.which == 8 || e.which >= 32) {
      self.doSearch.call(self, e, this);
    }
  });

  this.loadLibrary();
}

$.extend(library.prototype, {
  loadLibrary: function() {
    var self = this;
    $.get(this.url, function(data) {
      data.artists = data['okami/artists'];
      delete data['okami/artists'];

      self.data = data;
      self.library.append(Mustache.render(self.template, data));
      self.createIndex();
      self.target.trigger('loaded');
    }, 'json');
  },

  createIndex: function() {
    for (var i = 0; i < this.data.artists.length; i++) {
      var artist = this.data.artists[i];
      this.addToIndex(artist, 'artists');
      for (var j = 0; j < artist.albums.length; j++) {
        var album = artist.albums[j];
        album.artist = artist;
        this.addToIndex(album, 'albums');
        for (var k = 0; k < album.tracks.length; k++) {
          var track = album.tracks[k];
          track.album = album;
          track.artist = artist;
          this.addToIndex(track, 'tracks');
        }
      }
    }
  },

  addToIndex: function(obj, which) {
    var name = obj.name ? obj.name.toLowerCase() : 'unknown';
    for (var sublen = 1; sublen <= name.length; sublen++) {
      for (var i = 0; (i + sublen) <= name.length; i++) {
        var key = name.substr(i, sublen);
        if (!this.index[key]) {
          this.index[key] = {artists: [], albums: [], tracks: []};
        }
        this.index[key][which].push(obj);
      }
    }
  },

  doSearch: function(e, input) {
    var self = this;
    var query = $(input).val();
    if (query == "") {
      self.library.find('.hidden').removeClass('hidden');
    }
    else {
      var re = new RegExp(query, "i");
      var elts = self.library.find('.artists *');
      var hits = elts.filter(function() {
        return($(this).is('.artist, .album, .track') &&
          re.test($(this).data('name')));
      });
      var misses = elts.not(hits);
      var moreHits = $();
      hits.each(function() {
        var obj = $(this);
        var selector, openSelector, albumClass, artistClass;
        if (obj.hasClass('track')) {
          albumClass = '.album-' + obj.data('album_id');
          artistClass = '.artist-' + obj.data('artist_id');
          self.toggleNode(self.library.find('.album' + albumClass), true);
          self.toggleNode(self.library.find('.artist' + artistClass), true);
          selector = '.tracks' + albumClass + ', ' +
            '.album' + albumClass + ', ' +
            '.albums' + artistClass + ', ' +
            '.artist' + artistClass;
        }
        else if (obj.hasClass('album')) {
          albumClass = '.album-' + obj.data('id');
          artistClass = '.artist-' + obj.data('artist_id');
          self.toggleNode(self.library.find('.artist' + artistClass), true);
          selector = '.track' + albumClass +
            '.tracks' + albumClass + ', ' +
            '.albums' + artistClass + ', ' +
            '.artist' + artistClass;
        }
        else {
          selector = '.album.artist-' + obj.data('id') + ', ' +
            '.track.artist-' + obj.data('id');
        }
        var newHits = misses.filter(selector);
        moreHits = moreHits.add(newHits);
        misses = misses.not(newHits);
      });
      hits.removeClass('hidden');
      moreHits.removeClass('hidden');
      misses.addClass('hidden');
    }
  },

  toggleNode: function(parent, openOrClose) {
    if (typeof(openOrClose) == 'undefined') {
      openOrClose = parent.hasClass('closed');
    }

    if (openOrClose) {
      parent.removeClass('closed').addClass('open');
    }
    else {
      parent.removeClass('open').addClass('closed');
    }
    parent.next('.albums').toggle(openOrClose); // if parent is artist
    parent.next('.tracks').toggle(openOrClose); // if parent is album
  }
});

$.fn.library = function(method) {
  var obj = this.data('library');
  if (!obj) {
    this.data('library', new library(this, arguments[0]));
  }
  else if (obj[method]) {
    return obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
  }
  else {
    $.error('Method ' + method + ' does not exist on library object');
  }
}

})(jQuery);
