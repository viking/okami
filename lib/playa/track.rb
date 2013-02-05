module Playa
  class Track < Sequel::Model
    plugin :timestamps, :update_on_create => true

    many_to_one :artist
    many_to_one :album
  end
end
