unless Object.const_defined? :Okami
  require 'rubygems'
  require 'bundler'
  Bundler.require

  require './lib/okami'
end
run Okami::Application
