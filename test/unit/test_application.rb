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

  test "/artists" do
    dataset = stub('dataset')
    Okami::Artist.expects(:order).with(:name).returns(dataset)
    dataset.expects(:to_json).returns("foo")
    xhr '/artists'
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/artists?all=true" do
    track = stub('track', :id => 3, :name => "foo", :number => 1)
    album = stub('album', {
      :id => 4, :name => "bar", :year => 1234, :tracks => [track]
    })
    artist = stub('artist', :id => 5, :name => "baz", :albums => [album])
    dataset = stub('dataset')
    Okami::Artist.expects(:eager).with { |hash|
      hash.keys == [:albums] &&
        hash[:albums].length == 1 &&
        hash[:albums].keys[0].instance_of?(Proc) &&
        hash[:albums].values[0].keys == [:tracks] &&
        hash[:albums].values[0][:tracks].instance_of?(Proc)
    }.returns(dataset)
    dataset.expects(:order).with(:name).returns(dataset)
    dataset.expects(:to_json).with({
      :include => {:albums => {:include => :tracks}}
    }).returns("foo")
    xhr '/artists', :all => true
    assert last_response.ok?
    assert_equal "foo", last_response.body
  end

  test "/artists?all=true&limit=10&offset=20" do
    track = stub('track', :id => 3, :name => "foo", :number => 1)
    album = stub('album', {
      :id => 4, :name => "bar", :year => 1234, :tracks => [track]
    })
    artist = stub('artist', :id => 5, :name => "baz", :albums => [album])
    dataset = stub('dataset')
    Okami::Artist.expects(:limit).with(10, 20).returns(dataset)
    dataset.stubs(:eager).returns(dataset)
    dataset.stubs(:order).returns(dataset)
    dataset.stubs(:to_json).returns("foo")
    xhr '/artists', :all => true, :limit => 10, :offset => 20
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

  test "/discover/start" do
    seq = SequenceHelper.new('discover')
    seq << app.expects(:loader).returns(nil)
    loader = stub('loader')
    seq << Okami::Loader.expects(:new).returns(loader)
    seq << app.expects(:loader=).with(loader)
    seq << app.expects(:loader).returns(loader)
    seq << loader.expects(:run)
    seq << app.expects(:loader).returns(loader)
    seq << loader.expects(:status).returns('running')

    xhr '/discover/start'
    assert last_response.ok?
    assert_equal({'status' => 'running'}.to_json, last_response.body)
  end

  test "/discover/status" do
    seq = SequenceHelper.new('discover')
    loader = stub('loader')
    seq << app.expects(:loader).returns(loader)
    seq << loader.expects(:status).returns('running')
    seq << loader.expects(:num_files).returns(1000)
    seq << loader.expects(:files_checked).returns(100)

    xhr '/discover/status'
    assert last_response.ok?
    assert_equal({
      'status' => 'running', 'num_files' => 1000, 'files_checked' => 100
    }.to_json, last_response.body)
  end

  test "/discover/status with no loader" do
    app.expects(:loader).returns(nil)

    xhr '/discover/status'
    assert last_response.ok?
    assert_equal({'status' => nil}.to_json, last_response.body)
  end
end
