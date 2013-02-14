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

    def self.run
      new(Library).run
    end

    def initialize(root)
      @root = root
    end

    def run
      Database.transaction do
        marked = Track.select_map(:id)
        unmark = traverse(@root)
        marked -= unmark

        Track.filter(:id => marked).each(&:destroy)
        Album.orphaned.each(&:destroy)
        Artist.orphaned.each(&:destroy)
      end
    end

    def traverse(dir)
      track_ids_found = []
      Dir.glob(File.join(dir, "*")).each do |filename|
        if File.directory?(filename)
          track_ids_found += traverse(filename)
          next
        end

        info = Info.new(filename)
        next if info.empty?

        track = Track.filter(:filename => info.track[:filename]).first
        if track
          track_ids_found << track.id
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
      track_ids_found
    end
  end
end
