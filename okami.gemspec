# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'okami/version'

Gem::Specification.new do |gem|
  gem.name          = "okami"
  gem.version       = Okami::VERSION
  gem.authors       = ["Jeremy Stephens"]
  gem.email         = ["viking@pillageandplunder.net"]
  gem.description   = %q{Okami is a web-based music player. Run it from your library directory to spin up the server.}
  gem.summary       = %q{Okami is a web-based music player}
  gem.homepage      = ""

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]

  gem.add_dependency 'sinatra'
  gem.add_dependency 'sinatra-contrib'
  gem.add_dependency 'sequel'
  gem.add_dependency 'sqlite3'
  gem.add_dependency 'ruby-mp3info'
end
