require 'sinatra/base'
require 'sinatra/streaming'
require 'mustache/sinatra'
require 'sequel'
require 'mp3info'
require 'erb'
require 'yaml'
require 'pathname'
require 'logger'

module Playa
  Root = (Pathname.new(File.dirname(__FILE__)) + '..').expand_path
  Env = ENV['RACK_ENV'] || 'development'
  Library = ENV['PLAYA_LIBRARY'] || Dir.pwd
  Database = Sequel.connect({
    :adapter => 'sqlite',
    :database => ENV['PLAYA_DATABASE'] || File.join(Library, 'playa.db')
  })

  autoload :Artist, "playa/artist"
  autoload :Album, "playa/album"
  autoload :Track, "playa/track"
end
Sequel::Model.plugin :json_serializer
Sequel.extension :migration

require "playa/version"
require "playa/loader"
require "playa/views"
require "playa/application"
