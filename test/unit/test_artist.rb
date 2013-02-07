require 'helper'

class TestArtist < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Playa::Artist.superclass
  end

  test "formatted_name returns 'Unknown' if nil" do
    artist = Playa::Artist.new
    assert_equal "Unknown", artist.formatted_name
  end

  test "formatted_name returns 'Unknown' if empty" do
    artist = Playa::Artist.new(:name => "")
    assert_equal "Unknown", artist.formatted_name
  end

  test "formatted_name returns name is non-blank" do
    artist = Playa::Artist.new(:name => "foo")
    assert_equal "foo", artist.formatted_name
  end
end
