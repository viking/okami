require 'helper'

class TestLoader < Test::Unit::TestCase
  def self.const_missing(name)
    if Playa.const_defined?(name)
      Playa.const_get(name)
    else
      super
    end
  end

  test "#run creates new songs" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      loader.run

      assert_equal 1, Artist.count
      artist = Artist.first
      assert_equal "Foo", artist.name

      assert_equal 1, Album.count
      album = Album.first
      assert_equal "Bar", album.name
      assert_equal 2013, album.year
      assert_equal artist, album.artist

      assert_equal 1, Track.count
      track = Track.first
      assert_equal "Baz", track.name
      assert_equal 3, track.number
      assert_equal mp3_file, track.filename
      assert_equal artist, track.artist
      assert_equal album, track.album
    end
  end
end
