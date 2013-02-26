Sequel.migration do
  up do
    create_table(:status) do
      DateTime :last_updated_at
    end
  end
end
