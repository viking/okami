require "bundler/gem_tasks"
require "rake/testtask"

task :environment, :env do |cmd, args|
  ENV["RACK_ENV"] = args[:env] || "development"
  require "./lib/playa"
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
      require 'sequel/extensions/migration'
      Sequel::Migrator.apply(Playa::Database, "db/migrate")
    end
  end

  desc "Rollback the database"
  task :rollback, :env do |cmd, args|
    env = args[:env] || "development"
    Rake::Task['environment'].invoke(env)

    unless Dir.glob("db/migrate/*.rb").empty?
      require 'sequel/extensions/migration'
      version = (row = Playa::Database[:schema_info].first) ? row[:version] : nil
      Sequel::Migrator.apply(Playa::Database, "db/migrate", version - 1)
    end
  end

  desc "Nuke the database (drop all tables)"
  task :nuke, :env do |cmd, args|
    env = args[:env] || "development"
    Rake::Task['environment'].invoke(env)

    Playa::Database.tables.each do |table|
      Playa::Database.run("DROP TABLE #{table}")
    end
  end

  desc "Reset the database"
  task :reset, [:env] => [:nuke, :migrate]
end
