require 'rubygems'
require 'bundler'
begin
  Bundler.setup(:default, :development)
rescue Bundler::BundlerError => e
  $stderr.puts e.message
  $stderr.puts "Run `bundle install` to install missing gems"
  exit e.status_code
end

require 'test/unit'
require 'mocha/setup'
require 'rack/test'

$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))
require 'playa'

class SequenceHelper
  def initialize(name)
    @seq = sequence(name)
  end

  def <<(expectation)
    expectation.in_sequence(@seq)
  end
end
