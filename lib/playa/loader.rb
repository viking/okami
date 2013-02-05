module Playa
  class Loader
    def self.run
      new(Config['library']).run
    end

    def initialize(root)
      @root = root
    end

    def run
      traverse(@root)
    end

    def traverse(dir)
      Dir.glob(File.join(dir, "*")).each do |filename|
        case filename
        when /\.mp3$/i
          Mp3Info.open(filename) do |mp3info|
            artist = Artist.create(:name => mp3info.tag.artist)
            album = Album.create({
              :name => mp3info.tag.album, :year => mp3info.tag.year,
              :artist => artist
            })
            track = Track.create({
              :name => mp3info.tag.title, :number => mp3info.tag.tracknum,
              :filename => filename, :artist => artist, :album => album
            })
          end
        end
      end
    end
  end
end
