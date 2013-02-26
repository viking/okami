guard 'test' do
  watch(%r{^lib/((?:[^/]+\/)*)(.+)\.rb$}) do |m|
    "test/unit/#{m[1]}test_#{m[2]}.rb"
  end
  watch(%r{^test/((?:[^/]+\/)*)test.+\.rb$})
  watch('test/helper.rb') { 'test' }
  watch(%r{^templates/(?:([^/]+)\/)?.+\.mustache}) do |m|
    if m[1]
      "test/unit/extensions/test_#{m[1]}.rb"
    else
      'test/unit/test_application.rb'
    end
  end
end
