module Okami
  class Application < Sinatra::Base
    register Mustache::Sinatra
    helpers Sinatra::Streaming

    set :root, Root.to_s
    set :mustache, {
      :templates => (Root + 'templates').to_s,
      :views => (Root + 'lib' + 'okami' + 'views').to_s,
      :namespace => Okami
    }
    enable :reload_templates if development?

    get "/" do
      mustache :index
    end

    get "/library" do
      ds = Artist.eager_graph(:albums => :tracks).
        order(:artists__name, :albums__year, :albums__name, :tracks__number)
      ds.to_json({
        :include => {:albums => {:include => :tracks}},
        :root => :collection
      })
    end

    get "/artists" do
      Artist.order(:name).to_json
    end

    get "/albums" do
      dataset = Album
      if params[:artist_id]
        dataset = dataset.filter(:albums__artist_id => params[:artist_id])
      end
      dataset.order(:year, :name).to_json
    end

    get "/tracks" do
      dataset = Track.order(:number)
      if params[:album_id]
        dataset = dataset.filter(:album_id => params[:album_id])
      end
      dataset.to_json
    end

    get "/tracks/:id" do
      track = Track[:id => params[:id]]
      stream do |out|
        IO.copy_stream(track.filename, out)
      end
    end
  end
end
