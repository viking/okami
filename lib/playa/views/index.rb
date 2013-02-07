module Playa
  module Views
    class Index < Mustache
      def playlist_row_template
        partial('playlists/row').inspect
      end
    end
  end
end
