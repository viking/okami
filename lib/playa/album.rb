module Playa
  class Album < Sequel::Model
    plugin :timestamps, :update_on_create => true

    many_to_one :artist
    one_to_many :tracks
  end
end
