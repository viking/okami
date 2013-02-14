require 'helper'

class TestAlbum < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Okami::Album.superclass
  end

  test "formatted_name returns 'Unknown' if nil" do
    album = Okami::Album.new
    assert_equal "Unknown", album.formatted_name
  end

  test "formatted_name returns 'Unknown' if empty" do
    album = Okami::Album.new(:name => "")
    assert_equal "Unknown", album.formatted_name
  end

  test "formatted_name returns name is non-blank" do
    album = Okami::Album.new(:name => "foo")
    assert_equal "foo", album.formatted_name
  end
end
