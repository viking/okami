require 'sinatra/base'
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
end

require "playa/version"
require "playa/config"
require "playa/database"
require "playa/artist"
require "playa/album"
require "playa/track"
require "playa/loader"
require "playa/views"
require "playa/application"
