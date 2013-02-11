var currentSong;
function artistHelper(e) {
  var artist = $(this);
  var result = $('<div class="artist-drop"></div>');
  result.html(artist.data('name'));
  return(result);
}
function albumHelper(e) {
  var album = $(this);
  var result = $('<div class="album-drop"></div>');
  result.html(album.data('name'));
  return(result);
}
function trackHelper(e) {
  var track = $(this);
  var result = $('<div class="track-drop"></div>');
  result.html(track.data('name'));
  return(result);
}
function queueTracks(tracks) {
  tracks.each(function() {
    var track = $(this);
    var view = {
      id: track.data('id'),
      url: '/tracks/' + track.data('id'),
      number: track.data('number'),
      title: track.data('name'),
      album: $('.album.album-'+track.data('album_id')).data('name'),
      artist: $('.artist.artist-'+track.data('artist_id')).data('name')
    };
    $('#playlist').playlist('append', view);
  });
}
$(function() {
  var sidebar = $('#sidebar');
  sidebar.sidebar({
    artistsloaded: function(e) {
      $(this).find('.artist').draggable({
        revert: 'invalid',
        helper: artistHelper,
        appendTo: 'body'
      });
    },
    albumsloaded: function(e) {
      $(this).next('.albums').find('.album').draggable({
        revert: 'invalid',
        helper: albumHelper,
        appendTo: 'body'
      });
    },
    tracksloaded: function(e) {
      $(this).next('.tracks').find('.track').draggable({
        revert: 'invalid',
        helper: trackHelper,
        appendTo: 'body'
      });
    }
  });

  var playlist = $('#playlist');
  playlist.playlist();
  playlist.droppable({
    accept: '#sidebar .artist, #sidebar .album, #sidebar .track',
    drop: function(e, ui) {
      var obj = ui.draggable;
      var tracks;
      if (obj.hasClass('track')) {
        tracks = obj;
      }
      else {
        var which = obj.hasClass('artist') ? 'artist' : 'album';
        var selector = '#sidebar .track.' + which + '-' + obj.data('id');
        tracks = $(selector);
        if (tracks.length == 0) {
          if (which == 'artist') {
            obj.one('albumsloaded', function(e) {
              queueTracks($(selector));
            });
            sidebar.sidebar('loadAlbums', obj, true);
          }
          else {
            obj.one('tracksloaded', function(e) {
              queueTracks($(selector));
            });
            sidebar.sidebar('loadTracks', obj);
          }
          return;
        }
      }
      queueTracks(tracks);
    }
  });

  soundManager.setup({
    url: '/swf/'
  });
});
