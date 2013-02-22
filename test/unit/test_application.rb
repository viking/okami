require 'helper'

class TestApplication < Test::Unit::TestCase
  include Rack::Test::Methods
  include XhrHelper

  def app
    Okami::Application
  end

  test "/" do
    get '/'
    assert last_response.ok?
  end

  test "/library" do
    track = stub('track', :id => 3, :name => "foo", :number => 1)
    album = stub('album', {
      :id => 4, :name => "bar", :year => 1234, :tracks => [track]
    })
    artist = stub('artist', :id => 5, :name => "baz", :albums => [album])
    dataset = stub('dataset')
    Okami::Artist.expects(:eager_graph).with(:albums => :tracks).
      returns(dataset)
    dataset.expects(:order).
      with(:artists__name, :albums__year, :albums__name, :tracks__number).
      returns(dataset)
    dataset.expects(:to_json).with({
      :include => {:albums => {:include => :tracks}}
    }).returns("foo")
    xhr '/library'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/artists" do
    dataset = stub('dataset')
    Okami::Artist.expects(:order).with(:name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/artists'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/artists/1" do
    artist = stub('artist', :id => 1, :name => 'foo')
    Okami::Artist.expects(:[]).with(:id => '1').returns(artist)
    artist.expects(:to_json).returns("huge")

    xhr '/artists/1'
    assert last_response.ok?
    assert_equal "huge", last_response.body
  end

  test "/albums" do
    dataset = stub('dataset')
    Okami::Album.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/albums'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/artists/1/albums" do
    artist = stub('artist', :id => 1, :name => 'foo')
    Okami::Artist.expects(:[]).with(:id => '1').returns(artist)
    dataset = stub('dataset')
    artist.expects(:albums_dataset).returns(dataset)
    dataset.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:to_json).returns("foo")

    xhr '/artists/1/albums'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/albums/1" do
    album = stub('album', :id => 1, :name => 'foo')
    Okami::Album.expects(:[]).with(:id => '1').returns(album)
    album.expects(:to_json).returns("huge")

    xhr '/albums/1'
    assert last_response.ok?
    assert_equal "huge", last_response.body
  end

  test "/tracks" do
    dataset = stub('dataset')
    Okami::Track.expects(:order).with(:number).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/tracks'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/albums/1/tracks" do
    album = stub('album', :id => 1, :name => 'foo')
    Okami::Album.expects(:[]).with(:id => '1').returns(album)
    dataset = stub('dataset')
    album.expects(:tracks_dataset).returns(dataset)
    dataset.expects(:order).with(:number).returns(dataset)
    dataset.expects(:to_json).returns("foo")

    xhr '/albums/1/tracks'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/tracks/1" do
    track = stub('track', :id => 1, :name => 'foo')
    Okami::Track.expects(:[]).with(:id => '1').returns(track)
    track.expects(:to_json).returns("huge")

    xhr '/tracks/1'
    assert last_response.ok?
    assert_equal "huge", last_response.body
  end

  test "/tracks/1/stream" do
    track = stub('track', {
      :id => 1, :formatted_name => 'foo', :number => 1,
      :filename => "/foo/bar/foo.mp3"
    })
    Okami::Track.expects(:[]).with(:id => '1').returns(track)
    IO.expects(:copy_stream).
      with("/foo/bar/foo.mp3", instance_of(Sinatra::Helpers::Stream))

    xhr '/tracks/1/stream'
    assert last_response.ok?
  end
end
