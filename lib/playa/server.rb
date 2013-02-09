module Playa
  class Server < Rack::Server
    Playa::Application
  end
end
