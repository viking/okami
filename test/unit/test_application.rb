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
    dataset.expects(:all).returns([artist])
    xhr '/library'
    assert last_response.ok?
    assert_match %r{^<div}, last_response.body
  end

  test "/artists" do
    dataset = stub('dataset')
    Okami::Artist.expects(:order).with(:name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/artists'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/albums" do
    dataset = stub('dataset')
    Okami::Album.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/albums'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/albums?artist_id=1" do
    dataset = stub('dataset')
    Okami::Album.expects(:filter).with(:albums__artist_id => '1').returns(dataset)
    dataset.expects(:order).with(:year, :name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/albums', :artist_id => 1
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/tracks" do
    dataset = stub('dataset')
    Okami::Track.expects(:order).with(:number).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/tracks'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/tracks?album_id=1" do
    dataset = stub('dataset')
    Okami::Track.expects(:order).with(:number).returns(dataset)
    dataset.expects(:filter).with(:album_id => '1').returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/tracks', :album_id => 1
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/tracks/1" do
    track = stub('track', {
      :id => 1, :formatted_name => 'foo', :number => 1,
      :filename => "/foo/bar/foo.mp3"
    })
    Okami::Track.expects(:[]).with(:id => '1').returns(track)
    IO.expects(:copy_stream).
      with("/foo/bar/foo.mp3", instance_of(Sinatra::Helpers::Stream))

    xhr '/tracks/1'
    assert last_response.ok?
  end
end
