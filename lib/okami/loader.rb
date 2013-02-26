module Okami
  class Loader
    class Info
      attr_reader :artist, :album, :track

      def initialize(filename)
        case filename
        when /\.mp3$/i
          mp3 = Mp3Info.new(filename, :parse_mp3 => false)
          @artist = { :name => mp3.tag.artist }
          @album = { :name => mp3.tag.album, :year => mp3.tag.year }
          @track = {
            :name => mp3.tag.title, :number => mp3.tag.tracknum,
            :filename => filename
          }
          mp3.close
        end
      end

      def empty?
        @track.nil?
      end
    end

    attr_reader :status, :files_checked, :num_files

    def initialize(root = Library)
      @root = root
      @thread = nil
      @status = 'ready'
    end

    def run
      if @thread.nil? || !@thread.alive?
        @thread = Thread.new do
          @status = 'running'
          Database.transaction { _run }
          @status = 'finished'
        end
      end
      @thread
    end

    private

    def _run
      files = Dir.glob(File.join(@root, "**", "**"))
      @num_files = files.length

      marked = Track.select_map(:id)
      unmark = []
      files.each_with_index do |filename, i|
        @files_checked = i

        next if File.directory?(filename)

        info = Info.new(filename)
        next if info.empty?

        track = Track.filter(:filename => info.track[:filename]).first
        if track
          unmark << track.id
          if File.stat(filename).mtime > track.updated_at
            track_attribs = info.track

            artist = track.artist
            new_artist = nil
            unless info.artist.all? { |(k, v)| artist[k] == v }
              new_artist = Artist.find_or_create(info.artist)
              track_attribs[:artist] = new_artist
            end

            album = track.album
            new_album = nil
            if info.album.any? { |(k, v)| album[k] != v }
              new_album = Album.find_or_create(info.album.merge(:artist => artist))
              track_attribs[:album] = new_album
            elsif new_artist
              album.update(:artist => new_artist)
            end

            track.update(track_attribs)
            if new_artist && artist.tracks_dataset.count == 0
              artist.albums.each(&:destroy)
              artist.destroy
            elsif new_album && album.tracks_dataset.count == 0
              album.destroy
            end
          end
        else
          artist = Artist.find_or_create(info.artist)
          album = Album.find_or_create(info.album.merge(:artist => artist))
          track = Track.create(info.track.merge(:artist => artist, :album => album))
        end
      end
      @files_checked = @num_files
      marked -= unmark

      Track.filter(:id => marked).each(&:destroy)
      Album.orphaned.each(&:destroy)
      Artist.orphaned.each(&:destroy)
    end
  end
end
