module Playa
  class Application < Sinatra::Base
    register Mustache::Sinatra
    helpers Sinatra::Streaming

    set :root, Root.to_s
    set :mustache, {
      :templates => (Root + 'templates').to_s,
      :views => (Root + 'lib' + 'playa' + 'views').to_s,
      :namespace => Playa
    }
    enable :reload_templates if development?

    get "/" do
      mustache :index
    end

    get "/artists" do
      @artists = Artist.order(:name).all
      mustache :"artists/index", :layout => false
    end

    get "/albums" do
      dataset = Album
      if params[:artist_id]
        dataset = dataset.filter(:albums__artist_id => params[:artist_id])
      end
      if params[:tracks] == "true"
        dataset = dataset.eager_graph(:tracks).
          order(:albums__year, :albums__name, :tracks__number)
        @include_tracks = true
      else
        dataset = dataset.order(:year, :name)
      end
      @albums = dataset.all
      mustache :"albums/index", :layout => false
    end

    get "/tracks" do
      dataset = Track.order(:number)
      if params[:album_id]
        dataset = dataset.filter(:album_id => params[:album_id])
      end
      @tracks = dataset.all
      mustache :"tracks/index", :layout => false
    end

    get "/tracks/:id" do
      track = Track[:id => params[:id]]
      stream do |out|
        IO.copy_stream(track.filename, out)
      end
    end
  end
end
