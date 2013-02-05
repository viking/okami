module Playa
  config = Config['database']
  if config['logger']
    file = config['logger']
    config['logger'] = Logger.new(file == '_stderr_' ? STDERR : file)
  end
  Database = Sequel.connect(config)
end
