module Playa
  class Artist < Sequel::Model
    plugin :timestamps, :update_on_create => true

    one_to_many :albums
    one_to_many :tracks
  end
end
