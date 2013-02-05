require 'helper'

class TestTrack < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Playa::Track.superclass
  end
end
