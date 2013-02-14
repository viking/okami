module Okami
  class Artist < Sequel::Model
    plugin :timestamps, :update_on_create => true

    one_to_many :albums
    one_to_many :tracks

    dataset_module do
      def orphaned
        ids = select(:artists__id).left_join(:tracks, :artist_id => :id).
          group(:artists__id).having(:count.sql_function(:tracks__id) => 0)
        filter(:id => ids)
      end
    end

    def formatted_name
      (name.nil? || name.empty?) ? "Unknown" : name
    end
  end
end
