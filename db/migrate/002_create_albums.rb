Sequel.migration do
  up do
    create_table(:albums) do
      primary_key :id
      String :name
      Integer :year
      TrueClass :compilation
      foreign_key :artist_id, :artists
    end
  end
end
