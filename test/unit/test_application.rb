require 'helper'

class TestApplication < Test::Unit::TestCase
  include Rack::Test::Methods
  include XhrHelper

  def app
    Playa::Application
  end

  test "/" do
    get '/'
    assert last_response.ok?
  end

  test "/artists" do
    artist = stub('artist', :id => 1, :formatted_name => 'foo')
    dataset = stub('dataset')
    Playa::Artist.expects(:order).with(:name).returns(dataset)
    dataset.expects(:all).returns([artist])
    xhr '/artists'
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/albums" do
    album = stub('album', :id => 1, :formatted_name => 'foo', :year => 1234)
    dataset = stub('dataset')
    Playa::Album.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:all).returns([album])

    xhr '/albums'
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/albums?artist_id=1" do
    album = stub('album', :id => 1, :formatted_name => 'foo', :year => 1234)
    dataset = stub('dataset')
    Playa::Album.expects(:filter).with(:albums__artist_id => '1').returns(dataset)
    dataset.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:all).returns([album])

    xhr '/albums', :artist_id => 1
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/albums?artist_id=1&tracks=true" do
    track = stub('track', :id => 1, :formatted_name => 'bar', :number => 1)
    album = stub('album', {
      :id => 1, :formatted_name => 'foo', :year => 1234, :tracks => [track]
    })
    dataset = stub('dataset')
    Playa::Album.expects(:filter).
      with(:albums__artist_id => '1').returns(dataset)
    dataset.expects(:eager_graph).with(:tracks).returns(dataset)
    dataset.expects(:order).
      with(:albums__year, :albums__name, :tracks__number).returns(dataset)
    dataset.expects(:all).returns([album])

    xhr '/albums', :artist_id => 1, :tracks => true
    assert last_response.ok?
    assert_match %r{track-1}, last_response.body
  end

  test "/tracks" do
    track = stub('track', :id => 1, :formatted_name => 'foo', :number => 1)
    dataset = stub('dataset')
    Playa::Track.expects(:order).with(:number).returns(dataset)
    dataset.expects(:all).returns([track])

    xhr '/tracks'
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/tracks?album_id=1" do
    track = stub('track', :id => 1, :formatted_name => 'foo', :number => 1)
    dataset = stub('dataset')
    Playa::Track.expects(:order).with(:number).returns(dataset)
    dataset.expects(:filter).with(:album_id => '1').returns(dataset)
    dataset.expects(:all).returns([track])

    xhr '/tracks', :album_id => 1
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/tracks/1" do
    track = stub('track', {
      :id => 1, :formatted_name => 'foo', :number => 1,
      :filename => "/foo/bar/foo.mp3"
    })
    Playa::Track.expects(:[]).with(:id => '1').returns(track)
    IO.expects(:copy_stream).
      with("/foo/bar/foo.mp3", instance_of(Sinatra::Helpers::Stream))

    xhr '/tracks/1'
    assert last_response.ok?
  end
end
