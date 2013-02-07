module Playa
  class Application < Sinatra::Base
    register Mustache::Sinatra

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
      @artists = Artist.all
      mustache :"artists/index", :layout => false
    end

    get "/albums/:artist_id" do
      @albums = Album.filter(:artist_id => params[:artist_id]).all
      mustache :"albums/index", :layout => false
    end

    get "/tracks/:album_id" do
      @tracks = Track.filter(:album_id => params[:album_id]).all
      mustache :"tracks/index", :layout => false
    end
  end
end
