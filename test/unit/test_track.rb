require 'helper'

class TestTrack < Test::Unit::TestCase
  test "subclass of Sequel::Model" do
    assert_equal Sequel::Model, Okami::Track.superclass
  end

  test "formatted_name returns 'Unknown' if nil" do
    track = Okami::Track.new
    assert_equal "Unknown", track.formatted_name
  end

  test "formatted_name returns 'Unknown' if empty" do
    track = Okami::Track.new(:name => "")
    assert_equal "Unknown", track.formatted_name
  end

  test "formatted_name returns name is non-blank" do
    track = Okami::Track.new(:name => "foo")
    assert_equal "foo", track.formatted_name
  end
end
