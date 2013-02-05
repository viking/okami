Sequel.migration do
  up do
    create_table(:artists) do
      primary_key :id
      String :name
      DateTime :created_at
      DateTime :updated_at
    end
  end
end
