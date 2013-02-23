require 'sinatra/base'
require 'sinatra/streaming'
require 'sequel'
require 'mp3info'
require 'erb'
require 'yaml'
require 'pathname'
require 'logger'

module Okami
  Root = (Pathname.new(File.dirname(__FILE__)) + '..').expand_path
  Env = ENV['RACK_ENV'] || 'development'
  Library = ENV['OKAMI_LIBRARY'] || Dir.pwd
  Database = Sequel.connect({
    :adapter => 'sqlite',
    :database => ENV['OKAMI_DATABASE'] || File.join(Library, 'okami.db'),
    :logger => Logger.new(STDERR)
  })

  autoload :Artist, "okami/artist"
  autoload :Album, "okami/album"
  autoload :Track, "okami/track"
end
Sequel::Model.plugin :json_serializer
Sequel.extension :migration

require "okami/version"
require "okami/loader"
require "okami/application"
