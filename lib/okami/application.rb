module Okami
  class Application < Sinatra::Base
    helpers Sinatra::Streaming

    set :root, Root.to_s
    set :loader, nil

    get "/" do
      send_file File.join(settings.views, 'index.html')
    end

    get "/artists" do
      dataset = Artist
      if params[:limit]
        dataset =
          if params[:offset]
            dataset.limit(params[:limit].to_i, params[:offset].to_i)
          else
            dataset.limit(params[:limit].to_i)
          end
      end

      if params[:all] == 'true'
        albums_proc = proc { |ds| ds.order(:year, :name) }
        tracks_proc = proc { |ds| ds.order(:number) }
        dataset.eager(:albums => {albums_proc => {:tracks => tracks_proc}}).
          order(:name).to_json(:include => {:albums => {:include => :tracks}})
      else
        dataset.order(:name).to_json
      end
    end

    get "/artists/:id" do
      Artist[:id => params[:id]].to_json
    end

    get "/albums" do
      Album.order(:year, :name).to_json
    end

    get "/albums/:id" do
      Album[:id => params[:id]].to_json
    end

    get "/artists/:id/albums" do
      artist = Artist[:id => params[:id]]
      artist.albums_dataset.order(:year, :name).to_json
    end

    get "/tracks" do
      dataset = Track.order(:number)
      if params[:album_id]
        dataset = dataset.filter(:album_id => params[:album_id])
      end
      dataset.to_json
    end

    get "/tracks/:id" do
      Track[:id => params[:id]].to_json
    end

    get "/albums/:id/tracks" do
      album = Album[:id => params[:id]]
      album.tracks_dataset.order(:number).to_json
    end

    get "/tracks/:id/stream" do
      track = Track[:id => params[:id]]
      stream do |out|
        IO.copy_stream(track.filename, out)
      end
    end

    get "/discover/start" do
      if settings.loader.nil?
        loader = Okami::Loader.new
        settings.loader = loader
      end
      settings.loader.run
      {'status' => settings.loader.status}.to_json
    end

    get "/discover/status" do
      loader = settings.loader
      data = {'status' => nil}
      if loader
        data['status'] = loader.status
        data['num_files'] = loader.num_files
        data['files_checked'] = loader.files_checked
      end
      data.to_json
    end
  end
end
