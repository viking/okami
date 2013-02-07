require 'helper'

class TestAlbum < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Playa::Album.superclass
  end

  test "formatted_name returns 'Unknown' if nil" do
    album = Playa::Album.new
    assert_equal "Unknown", album.formatted_name
  end

  test "formatted_name returns 'Unknown' if empty" do
    album = Playa::Album.new(:name => "")
    assert_equal "Unknown", album.formatted_name
  end

  test "formatted_name returns name is non-blank" do
    album = Playa::Album.new(:name => "foo")
    assert_equal "foo", album.formatted_name
  end
end
