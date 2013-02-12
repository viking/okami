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
