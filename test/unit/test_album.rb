require 'helper'

class TestAlbum < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Playa::Album.superclass
  end
end
