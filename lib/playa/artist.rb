module Playa
  class Artist < Sequel::Model
    plugin :timestamps, :update_on_create => true
  end
end
