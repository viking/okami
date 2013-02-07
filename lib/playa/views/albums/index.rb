module Playa
  module Views
    module Albums
      class Index < Mustache
        attr_reader :albums, :include_tracks

        def tracks_hidden
          !@include_tracks
        end
      end
    end
  end
end
