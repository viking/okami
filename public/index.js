var currentSong;
function loadAlbums(artist, includeTracks, callback) {
  var params = {artist_id: artist.data('id')};
  if (includeTracks) {
    params.tracks = 'true';
  }
  $.get('/albums', params, function(data) {
    artist.after(data);
    artist.next('.albums').find('.album').draggable({
      revert: 'invalid',
      helper: albumHelper,
      appendTo: 'body'
    });
    if (callback) {
      callback();
    }
  }, 'html');
}
function loadTracks(album, callback) {
  $.get('/tracks', {album_id: album.data('id')}, function(data) {
    album.after(data);
    album.next('.tracks').find('.track').draggable({
      revert: 'invalid',
      helper: trackHelper,
      appendTo: 'body'
    });
    if (callback) {
      callback();
    }
  }, 'html');
}
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
  $('#playlist').playlist();
  $('#playlist').droppable({
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
            loadAlbums(obj, true, function() {
              queueTracks($(selector));
            });
          }
          else {
            loadTracks(obj, function() {
              queueTracks($(selector));
            });
          }
          return;
        }
      }
      queueTracks(tracks);
    }
  });
  var sidebar = $('#sidebar');
  $.get('/artists', function(data) {
    sidebar.append(data);
    sidebar.find('.artist').draggable({
      revert: 'invalid',
      helper: artistHelper,
      appendTo: 'body'
    });
  }, 'html');

  sidebar.
    on('click', '.artist', function(e) {
      var artist = $(this);
      var albums = artist.next('.albums');
      if (albums.length == 0) {
        loadAlbums(artist);
      }
      else {
        albums.toggle();
      }
    }).
    on('click', '.album', function(e) {
      var album = $(this);
      var tracks = album.next('.tracks');
      if (tracks.length == 0) {
        loadTracks(album);
      }
      else {
        tracks.toggle();
      }
    }).
    on('click', '.track', function(e) {
    });

  soundManager.setup({
    url: '/swf/'
  });
});
