module Okami
  class Track < Sequel::Model
    plugin :timestamps, :update_on_create => true

    many_to_one :artist
    many_to_one :album

    def formatted_name
      (name.nil? || name.empty?) ? "Unknown" : name
    end
  end
end
