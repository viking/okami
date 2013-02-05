Sequel.migration do
  up do
    create_table(:tracks) do
      primary_key :id
      String :name
      Integer :number
      String :filename
      foreign_key :artist_id, :artists
      foreign_key :album_id, :albums
    end
  end
end
