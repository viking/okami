module Playa
  class Application < Sinatra::Base
    register Mustache::Sinatra

    set :root, Root.to_s
    set :mustache, {
      :templates => (Root + 'templates').to_s,
      :views => (Root + 'lib' + 'playa' + 'views').to_s,
      :namespace => Playa
    }
    enable :reload_templates if development?

    get "/" do
      mustache :index
    end
  end
end
