# Script to check PostgreSQL database initialization

Write-Host "Checking PostgreSQL database..." -ForegroundColor Blue

# Check if containers are running
Write-Host "`nContainer status:" -ForegroundColor Yellow
docker-compose ps

Write-Host "`n--- Checking Tables ---" -ForegroundColor Yellow
docker exec event-postgres psql -U postgres -d event_management -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

Write-Host "`n--- Counting Users ---" -ForegroundColor Yellow
docker exec event-postgres psql -U postgres -d event_management -t -c "SELECT COUNT(*) as total_users FROM users;"

Write-Host "`n--- User Roles Distribution ---" -ForegroundColor Yellow
docker exec event-postgres psql -U postgres -d event_management -c "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;"

Write-Host "`n--- Sample Users ---" -ForegroundColor Yellow
docker exec event-postgres psql -U postgres -d event_management -c "SELECT id, email, name, role FROM users ORDER BY id LIMIT 5;"

Write-Host "`n--- Checking Categories ---" -ForegroundColor Yellow
docker exec event-postgres psql -U postgres -d event_management -c "SELECT * FROM categories;"

Write-Host "`nDatabase check completed!" -ForegroundColor Green
