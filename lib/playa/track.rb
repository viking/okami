module Playa
  class Track < Sequel::Model
    many_to_one :artist
    many_to_one :album
  end
end
