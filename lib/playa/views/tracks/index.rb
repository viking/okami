module Playa
  module Views
    module Tracks
      class Index < Mustache
        attr_reader :tracks

        def tracks_hidden
          false
        end
      end
    end
  end
end
