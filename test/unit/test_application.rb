require 'helper'

class TestApplication < Test::Unit::TestCase
  include Rack::Test::Methods
  include XhrHelper

  def app
    Playa::Application
  end

  test "index" do
    get '/'
    assert last_response.ok?
    assert_match "sup?", last_response.body
  end

  test "artists partial" do
    artist = stub('artist', :id => 1, :name => 'foo')
    Playa::Artist.expects(:all).returns([artist])
    xhr '/artists'
    assert last_response.ok?
    assert_match %r{^<ul}, last_response.body
  end

  test "albums for artist" do
    album = stub('album', :id => 1, :name => 'foo', :year => 1234)
    dataset = stub('dataset')
    Playa::Album.expects(:filter).with(:artist_id => '1').returns(dataset)
    dataset.expects(:all).returns([album])

    xhr '/albums/1'
    assert last_response.ok?
    assert_match %r{^<ul}, last_response.body
  end

  test "tracks for album" do
    track = stub('track', :id => 1, :name => 'foo', :number => 1)
    dataset = stub('dataset')
    Playa::Track.expects(:filter).with(:album_id => '1').returns(dataset)
    dataset.expects(:all).returns([track])

    xhr '/tracks/1'
    assert last_response.ok?
    assert_match %r{^<ul}, last_response.body
  end
end
