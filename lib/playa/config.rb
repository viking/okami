module Playa
  config_path = Root + 'config.yml'
  config_tmpl = ERB.new(File.read(config_path))
  config_tmpl.filename = config_path.to_s
  Config = YAML.load(config_tmpl.result(binding))[Env]
end
