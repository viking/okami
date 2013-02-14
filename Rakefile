require "bundler/gem_tasks"
require "rake/testtask"

task :environment, :env do |cmd, args|
  ENV["RACK_ENV"] = args[:env] || "development"
  require "./lib/okami"
end

Rake::TestTask.new do |t|
  t.libs << "test"
  t.pattern = 'test/**/test*.rb'
end
task :default => :test

namespace :db do
  desc "Run database migrations"
  task :migrate, :env do |cmd, args|
    env = args[:env] || "development"
    Rake::Task['environment'].invoke(env)

    unless Dir.glob("db/migrate/*.rb").empty?
      Sequel::Migrator.apply(Okami::Database, "db/migrate")
    end
  end

  desc "Rollback the database"
  task :rollback, :env do |cmd, args|
    env = args[:env] || "development"
    Rake::Task['environment'].invoke(env)

    unless Dir.glob("db/migrate/*.rb").empty?
      version = (row = Okami::Database[:schema_info].first) ? row[:version] : nil
      Sequel::Migrator.apply(Okami::Database, "db/migrate", version - 1)
    end
  end

  desc "Nuke the database (drop all tables)"
  task :nuke, :env do |cmd, args|
    env = args[:env] || "development"
    Rake::Task['environment'].invoke(env)

    Okami::Database.tables.each do |table|
      Okami::Database.run("DROP TABLE #{table}")
    end
  end

  desc "Reset the database"
  task :reset, [:env] => [:nuke, :migrate]
end

# To record mp3 files with sox, you need the following
# packages: sox libsox-fmt-mp3
desc "Generate white noise mp3 with sox"
task :noise, :filename do |cmd, args|
  if args[:filename].nil?
    puts "Filename argument required!"
  else
    `rec #{args[:filename]} synth 1 whitenoise vol 0.25`
  end
end
