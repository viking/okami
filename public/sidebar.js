(function($) {

var defaults = {
  searchHtml: '<div class="search">' +
    '<form>' +
      '<label for="search">Search:</label>' +
      '<input id="search" class="search" type="text" name="search" />' +
    '</form>' +
  '</div>',

  libraryUrl: '/library'
}

function sidebar(target, opts) {
  var self = this;
  this.target = $(target);
  var options = $.extend({}, defaults, opts);
  this.libraryUrl = options.libraryUrl;
  this.target.append(options.searchHtml);
  this.search = this.target.find('input.search');
  this.target.append('<div class="library"></div>');
  this.library = this.target.find('.library');

  if ('loaded' in options) {
    this.target.bind('loaded', options.loaded);
  }

  /* setup interaction */
  this.target.
    on('click', '.artist', function(e) {
      var artist = $(this);
      var albums = artist.next('.albums');
      if (artist.hasClass('open')) {
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
      if (album.hasClass('open')) {
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

  /* setup search */
  this.search.keyup(function(e) {
    if (e.which == 8 || e.which >= 32) {
      self.doSearch.call(self, e, this);
    }
  });

  this.loadLibrary();
}

$.extend(sidebar.prototype, {
  loadLibrary: function() {
    var self = this;
    $.get(this.libraryUrl, function(data) {
      self.library.append(data);
      self.target.trigger('loaded');
    }, 'html');
  },
  doSearch: function(e, input) {
    var self = this;
    var query = $(input).val();
    if (query == "") {
      self.target.find('.hidden').removeClass('hidden');
    }
    else {
      var re = new RegExp(query, "i");
      var elts = self.library.find('.artist, .album, .track');
      var hits = elts.filter(function() {
        return re.test($(this).data('name'));
      });
      var misses = elts.not(hits);
      var moreHits = $();
      hits.each(function() {
        var obj = $(this);
        var selector;
        if (obj.hasClass('track')) {
          obj.closest('.tracks').show();
          obj.closest('.album').removeClass('closed').addClass('open');
          obj.closest('.albums').show();
          obj.closest('.artist').removeClass('closed').addClass('open');

          selector = '.album.album-' + obj.data('album_id') + ', ' +
            '.artist.artist-' + obj.data('artist_id');
        }
        else if (obj.hasClass('album')) {
          obj.closest('.albums').show();
          obj.closest('.artist').removeClass('closed').addClass('open');

          selector = '.artist.artist-' + obj.data('artist_id') + ', ' +
            '.track.album-' + obj.data('id');
        }
        else {
          selector = '.album.artist-' + obj.data('id') +
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
