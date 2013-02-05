Sequel.migration do
  up do
    create_table(:artists) do
      primary_key :id
      String :name
    end
  end
end
