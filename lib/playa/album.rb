module Playa
  class Album < Sequel::Model
    plugin :timestamps, :update_on_create => true

    many_to_one :artist
    one_to_many :tracks

    dataset_module do
      def orphaned
        ids = select(:albums__id).left_join(:tracks, :album_id => :id).
          group(:albums__id).having(:count.sql_function(:tracks__id) => 0)
        filter(:id => ids)
      end
    end
  end
end
