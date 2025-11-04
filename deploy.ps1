# PowerShell deployment script for Windows
# Event Management Application

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod', 'stop', 'restart', 'logs', 'clean', 'backup')]
    [string]$Action = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$Build,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$GREEN = "`e[32m"
$BLUE = "`e[34m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$NC = "`e[0m"

function Show-Help {
    Write-Host "${BLUE}Event Management - Docker Deployment Script${NC}"
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 -Action <action> [-Build]"
    Write-Host ""
    Write-Host "${GREEN}Actions:${NC}"
    Write-Host "  dev       - Start development environment"
    Write-Host "  prod      - Start production environment"
    Write-Host "  stop      - Stop all services"
    Write-Host "  restart   - Restart all services"
    Write-Host "  logs      - Show logs"
    Write-Host "  clean     - Clean up containers and volumes"
    Write-Host "  backup    - Backup databases"
    Write-Host ""
    Write-Host "${GREEN}Options:${NC}"
    Write-Host "  -Build    - Rebuild containers before starting"
    Write-Host "  -Help     - Show this help message"
    Write-Host ""
    Write-Host "${GREEN}Examples:${NC}"
    Write-Host "  .\deploy.ps1 -Action dev"
    Write-Host "  .\deploy.ps1 -Action prod -Build"
    Write-Host "  .\deploy.ps1 -Action logs"
    exit 0
}

function Check-Docker {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
    } catch {
        Write-Host "${RED}Error: Docker or Docker Compose is not installed!${NC}"
        exit 1
    }
}

function Setup-Environment {
    if (-not (Test-Path .env)) {
        Write-Host "${YELLOW}Creating .env file from template...${NC}"
        Copy-Item .env.docker .env
        Write-Host "${GREEN}.env file created!${NC}"
        Write-Host "${YELLOW}Please edit .env file with your configuration before continuing.${NC}"
        notepad .env
        Read-Host "Press Enter after editing .env file to continue"
    }
}

function Start-Development {
    Write-Host "${BLUE}Starting development environment...${NC}"
    Setup-Environment
    
    if ($Build) {
        docker-compose up -d --build
    } else {
        docker-compose up -d
    }
    
    Write-Host "${GREEN}Development environment started!${NC}"
    Write-Host "Frontend: ${BLUE}http://localhost:3000${NC}"
    Write-Host "Backend: ${BLUE}http://localhost:5000${NC}"
}

function Start-Production {
    Write-Host "${BLUE}Starting production environment...${NC}"
    Setup-Environment
    
    if ($Build) {
        docker-compose -f docker-compose.prod.yml up -d --build
    } else {
        docker-compose -f docker-compose.prod.yml up -d
    }
    
    Write-Host "${GREEN}Production environment started!${NC}"
    Write-Host "Application: ${BLUE}http://localhost${NC}"
}

function Stop-Services {
    Write-Host "${BLUE}Stopping services...${NC}"
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    Write-Host "${GREEN}Services stopped!${NC}"
}

function Restart-Services {
    Write-Host "${BLUE}Restarting services...${NC}"
    docker-compose restart
    Write-Host "${GREEN}Services restarted!${NC}"
}

function Show-Logs {
    Write-Host "${BLUE}Showing logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

function Clean-Everything {
    Write-Host "${RED}WARNING: This will remove all containers, volumes, and data!${NC}"
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq 'yes') {
        Write-Host "${BLUE}Cleaning up...${NC}"
        docker-compose down -v
        docker system prune -af
        Write-Host "${GREEN}Cleanup completed!${NC}"
    } else {
        Write-Host "${YELLOW}Cleanup cancelled.${NC}"
    }
}

function Backup-Databases {
    Write-Host "${BLUE}Backing up databases...${NC}"
    
    # Create backup directory
    if (-not (Test-Path backups)) {
        New-Item -ItemType Directory -Path backups | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    # Backup PostgreSQL
    Write-Host "Backing up PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U postgres event_management > "backups\postgres_backup_$timestamp.sql"
    
    # Backup MongoDB
    Write-Host "Backing up MongoDB..."
    docker-compose exec mongodb mongodump --out=/tmp/backup
    docker-compose cp mongodb:/tmp/backup "backups\mongodb_backup_$timestamp"
    
    Write-Host "${GREEN}Backups completed!${NC}"
    Write-Host "Location: ${BLUE}.\backups\${NC}"
}

function Show-Status {
    Write-Host "${BLUE}Service Status:${NC}"
    docker-compose ps
    
    Write-Host ""
    Write-Host "${BLUE}Health Checks:${NC}"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2
        Write-Host "Backend: ${GREEN}✓ Healthy${NC}"
    } catch {
        Write-Host "Backend: ${RED}✗ Not responding${NC}"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
        Write-Host "Frontend: ${GREEN}✓ Healthy${NC}"
    } catch {
        Write-Host "Frontend: ${RED}✗ Not responding${NC}"
    }
}

# Main script
if ($Help) {
    Show-Help
}

Check-Docker

switch ($Action) {
    'dev' { Start-Development }
    'prod' { Start-Production }
    'stop' { Stop-Services }
    'restart' { Restart-Services }
    'logs' { Show-Logs }
    'clean' { Clean-Everything }
    'backup' { Backup-Databases }
    default { Show-Help }
}

Write-Host ""
Write-Host "${BLUE}Run '.\deploy.ps1 -Help' for more options${NC}"
