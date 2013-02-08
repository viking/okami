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
  var result = $('<div class="artist"></div>');
  result.data(artist.data());
  result.html(artist.data('name'));
  return(result);
}
function albumHelper(e) {
  var album = $(this);
  var result = $('<div class="album"></div>');
  result.data(album.data());
  result.html(album.data('name'));
  return(result);
}
function trackHelper(e) {
  var track = $(this);
  var result = $('<div class="track"></div>');
  result.data(track.data());
  result.html(track.data('name'));
  return(result);
}
function queueTracks(tracks) {
  var playlist = $('#playlist > table > tbody');
  tracks.each(function() {
    var track = $(this);
    var view = {
      number: track.data('number'),
      track: track.data('name'),
      album: $('.album.album-'+track.data('album_id')).data('name'),
      artist: $('.artist.artist-'+track.data('artist_id')).data('name')
    };
    var row = $($.mustache(rowTemplate, view));
    row.data('track_id', track.data('id'));
    playlist.append(row);
  });
}
function selectedSong() {
  return $('#playlist tbody tr.selected');
}
function selectPrevSong() {
  var current = selectedSong();
  if (current.length == 0) {
    $('#playlist tbody tr:last').addClass('selected');
  }
  else if (!current.is('#playlist tbody tr:first')) {
    current.removeClass('selected');
    current.prev('tr').addClass('selected');
  }
}
function selectNextSong() {
  var current = selectedSong();
  if (current.length == 0) {
    $('#playlist tbody tr:first').addClass('selected');
  }
  else if (!current.is('#playlist tbody tr:last')) {
    current.removeClass('selected');
    current.next('tr').addClass('selected');
  }
}
function playSelectedSong() {
  var current = selectedSong();
  if (current.length == 0) {
    return;
  }

  var track_id = current.data('track_id');
  currentSong = soundManager.createSound({
    id: 'track-' + track_id,
    url: '/tracks/' + track_id,
    autoLoad: true,
    volume: 50,
    onload: function(success) {
      if (success) {
        this.play();
        $('#play').button('option', 'icons', {primary: 'ui-icon-pause'}).
          addClass('pause');
      }
    },
    onfinish: function() {
      this.destruct();
      playNextSong();
    }
  });
}
function playNextSong() {
  selectNextSong();
  playSelectedSong();
}
$(function() {
  $('#playlist').droppable({
    accept: '.track, .album, .artist',
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
  $('#playlist > table > tbody').sortable();
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

  $('#clear').button({
    icons: {
      primary: "ui-icon-trash"
    },
    text: false
  }).click(function(e) {
    $('#playlist tbody').html('');
  });

  $('#prev').button({
    icons: {
      primary: "ui-icon-seek-first"
    },
    text: false
  }).click(function(e) {
    var startPlaying = false;
    selectPrevSong();
    if (currentSong) {
      startPlaying = currentSong.playState == 1;
      currentSong.stop();
      currentSong.destruct();
    }
    if (startPlaying) {
      playSelectedSong();
    }
  });

  $('#play').button({
    icons: {
      primary: "ui-icon-play"
    },
    text: false
  }).click(function(e) {
    var obj = $(this);
    if (currentSong) {
      if (obj.hasClass('pause')) {
        currentSong.pause();
        obj.removeClass('pause');
        obj.button('option', 'icons', {primary: 'ui-icon-play'})
      }
      else {
        currentSong.play();
        obj.addClass('pause');
        obj.button('option', 'icons', {primary: 'ui-icon-pause'})
      }
    }
    else if (selectedSong().length == 0) {
      playNextSong();
    }
    else {
      playSelectedSong();
    }
  });

  $('#stop').button({
    icons: {
      primary: "ui-icon-stop"
    },
    text: false
  }).click(function(e) {
    if (currentSong) {
      currentSong.stop();
    }
    $('#play').removeClass('pause').
      button('option', 'icons', {primary: 'ui-icon-play'})
  });

  $('#next').button({
    icons: {
      primary: "ui-icon-seek-end"
    },
    text: false
  }).click(function(e) {
    var startPlaying = false;
    selectNextSong();
    if (currentSong) {
      startPlaying = currentSong.playState == 1;
      currentSong.stop();
      currentSong.destruct();
    }
    if (startPlaying) {
      playSelectedSong();
    }
  });

  soundManager.setup({
    url: '/swf/'
  });
});
