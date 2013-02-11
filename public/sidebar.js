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
    var query = $(this).val();
    if (query == "") {
      self.target.find('.open').show();
    }
    else {
      console.log(self.target.find("[data-name*='"+query+"']"));
    }
  });

  this.loadLibrary();
}

$.extend(sidebar.prototype, {
  loadLibrary: function() {
    var self = this;
    $.get(this.libraryUrl, function(data) {
      self.target.append(data);
      self.target.trigger('loaded');
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
