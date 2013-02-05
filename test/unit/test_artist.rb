require 'helper'

class TestArtist < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Playa::Artist.superclass
  end
end
