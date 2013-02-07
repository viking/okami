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

  test "#run reuses artists and albums" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      FileUtils.cp(fixture_path("foo-2.mp3"), root)

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

      assert_equal 2, Track.count
      assert_equal %w{Baz Qux}, Track.order(:number).select_map(:name)
    end
  end

  test "#run creates new album if artist doesn't match" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("bar.mp3"), root)
      FileUtils.cp(fixture_path("bar-2.mp3"), root)

      loader = Loader.new(root)
      loader.run

      assert_equal 1, Artist.count
      assert_equal 2, Album.count
      assert_equal 2, Track.count
    end
  end

  test "#run updates track title" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      Timecop.freeze(Time.now - 123) { loader.run }

      Mp3Info.open(mp3_file) do |mp3|
        mp3.tag.title = "Qux"
      end
      loader.run

      assert_equal 1, Artist.count
      assert_equal 1, Album.count

      assert_equal 1, Track.count
      track = Track.first
      assert_equal "Qux", track.name
    end
  end

  test "#run creates new artist on artist name change" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      FileUtils.cp(fixture_path("foo.mp3"), File.join(root, "bar.mp3"))
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      Timecop.freeze(Time.now - 123) { loader.run }

      Mp3Info.open(mp3_file) do |mp3|
        mp3.tag.artist = "Bar"
      end
      loader.run

      assert_equal 2, Artist.count
      track = Track.filter(:filename => mp3_file).first
      artist = Artist.filter(:name => 'Bar').first
      assert_equal artist, track.artist
    end
  end

  test "#run deletes orphaned artist" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      Timecop.freeze(Time.now - 123) { loader.run }

      Mp3Info.open(mp3_file) do |mp3|
        mp3.tag.artist = "Foo bar"
      end
      loader.run

      assert_equal 1, Artist.count
      artist = Artist.first
      assert_equal "Foo bar", artist.name

      assert_equal 1, Album.count
      assert_equal 1, Track.count
    end
  end

  test "#run creates new album on album name change" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      FileUtils.cp(fixture_path("foo.mp3"), File.join(root, "bar.mp3"))
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      Timecop.freeze(Time.now - 123) { loader.run }

      Mp3Info.open(mp3_file) do |mp3|
        mp3.tag.album = "Blah"
      end
      loader.run

      assert_equal 2, Album.count
      track = Track.filter(:filename => mp3_file).first
      album = Album.filter(:name => 'Blah').first
      assert_equal album, track.album
    end
  end

  test "#run deletes orphaned album" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      Timecop.freeze(Time.now - 123) { loader.run }

      Mp3Info.open(mp3_file) do |mp3|
        mp3.tag.album = "Blah"
      end
      loader.run

      assert_equal 1, Album.count
      album = Album.first
      track = Track.first
      assert_equal album, track.album
      assert_equal "Blah", album.name
    end
  end

  test "#run cleans up orphaned records after file deletion" do
    Dir.mktmpdir do |root|
      FileUtils.cp(fixture_path("foo.mp3"), root)
      mp3_file = File.join(root, "foo.mp3")

      loader = Loader.new(root)
      loader.run

      FileUtils.rm(mp3_file)
      loader.run

      assert_equal 0, Artist.count
      assert_equal 0, Album.count
      assert_equal 0, Track.count
    end
  end

  test "#run descends into subdirectories" do
    Dir.mktmpdir do |root|
      foo_dir = File.join(root, "foo")
      FileUtils.mkdir(foo_dir)
      FileUtils.cp(fixture_path("bar.mp3"), root)
      FileUtils.cp(fixture_path("foo.mp3"), foo_dir)
      mp3_file = File.join(foo_dir, "foo.mp3")

      loader = Loader.new(root)
      loader.run

      assert_equal 2, Artist.count
      assert_equal 2, Album.count
      assert_equal 2, Track.count
    end
  end
end
