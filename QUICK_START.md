# Quick Start Guide

Hướng dẫn nhanh để chạy ứng dụng Event Management với Docker.

## Khởi chạy nhanh (3 bước)

### Windows

```powershell
# Bước 1: Cấu hình môi trường
Copy-Item .env.docker .env
notepad .env  # Chỉnh sửa cấu hình

# Bước 2: Chạy ứng dụng
.\deploy.ps1 -Action dev

# Hoặc dùng docker-compose trực tiếp
docker-compose up -d
```

### Linux/Mac

```bash
# Bước 1: Cấu hình môi trường
cp .env.docker .env
nano .env  # Chỉnh sửa cấu hình

# Bước 2: Chạy ứng dụng
make dev

# Hoặc dùng docker-compose trực tiếp
docker-compose up -d
```

### Bước 3: Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Cấu hình tối thiểu

Chỉnh sửa file `.env` với các giá trị sau (các giá trị khác có thể để mặc định):

```env
# Passwords (QUAN TRỌNG - thay đổi cho production!)
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_very_long_random_secret_key_here

# Email (nếu cần gửi email)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

## Các lệnh cơ bản

### Windows (PowerShell)

```powershell
# Khởi động development
.\deploy.ps1 -Action dev

# Khởi động production
.\deploy.ps1 -Action prod -Build

# Xem logs
.\deploy.ps1 -Action logs

# Dừng services
.\deploy.ps1 -Action stop

# Restart
.\deploy.ps1 -Action restart

# Backup databases
.\deploy.ps1 -Action backup

# Cleanup toàn bộ
.\deploy.ps1 -Action clean
```

### Linux/Mac (Makefile)

```bash
# Khởi động development
make dev

# Khởi động production
make prod

# Xem logs
make logs

# Dừng services
make down

# Restart
make restart

# Backup databases
make backup

# Cleanup toàn bộ
make clean
```

### Universal (Docker Compose)

```bash
# Development
docker-compose up -d
docker-compose logs -f
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down

# Xem status
docker-compose ps

# Rebuild
docker-compose up -d --build
```

## Kiểm tra trạng thái

```bash
# Kiểm tra containers
docker-compose ps

# Kiểm tra health
curl http://localhost:5000/health
curl http://localhost:3000/health

# Xem logs
docker-compose logs -f server
docker-compose logs -f client
```

## Truy cập Databases

```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d event_management

# MongoDB
docker-compose exec mongodb mongosh event_management

# Redis
docker-compose exec redis redis-cli -a your_redis_password
```

## Troubleshooting

### Port đã được sử dụng

Thay đổi ports trong `.env`:

```env
CLIENT_PORT=3001
SERVER_PORT=5001
POSTGRES_PORT=5433
```

### Container không start

```bash
# Xem logs để tìm lỗi
docker-compose logs service_name

# Rebuild từ đầu
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection error

```bash
# Đảm bảo databases đã start xong
docker-compose ps

# Restart databases
docker-compose restart postgres mongodb redis

# Xem logs database
docker-compose logs postgres
```

### Out of memory

```bash
# Dọn dẹp Docker
docker system prune -a

# Tăng memory cho Docker Desktop
# Settings > Resources > Memory
```

## Build Production Image

```bash
# Build images
docker-compose build

# Tag images
docker tag event-management-server:latest your-registry/event-server:v1.0.0
docker tag event-management-client:latest your-registry/event-client:v1.0.0

# Push to registry
docker push your-registry/event-server:v1.0.0
docker push your-registry/event-client:v1.0.0
```

## Deploy lên Server

### 1. Chuẩn bị Server

```bash
# Cài Docker và Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Upload Code

```bash
# Clone repository
git clone <your-repo-url>
cd event-management

# Hoặc upload qua SCP
scp -r . user@server:/path/to/event-management
```

### 3. Cấu hình và Chạy

```bash
# Cấu hình environment
cp .env.docker .env
nano .env  # Điều chỉnh cho production

# Chạy production
docker-compose -f docker-compose.prod.yml up -d

# Xem logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Setup Firewall

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Hoặc iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Security Checklist

- [ ] Đổi tất cả passwords mặc định trong `.env`
- [ ] Sử dụng strong JWT_SECRET (>32 ký tự ngẫu nhiên)
- [ ] Không commit file `.env` lên Git
- [ ] Setup HTTPS với Let's Encrypt
- [ ] Cấu hình firewall (chỉ mở port 80, 443)
- [ ] Backup định kỳ databases
- [ ] Monitor logs và resources
- [ ] Update images thường xuyên

## Monitoring

```bash
# Xem resource usage
docker stats

# Xem logs realtime
docker-compose logs -f

# Kiểm tra health
watch -n 5 'curl -s http://localhost:5000/health | jq'
```

## Backup và Restore

### Backup

```bash
# Windows
.\deploy.ps1 -Action backup

# Linux/Mac
make backup

# Manual
docker-compose exec postgres pg_dump -U postgres event_management > backup.sql
docker-compose exec mongodb mongodump --out=/tmp/backup
```

### Restore

```bash
# PostgreSQL
docker-compose exec -T postgres psql -U postgres event_management < backup.sql

# MongoDB
docker-compose cp ./mongodb-backup mongodb:/tmp/restore
docker-compose exec mongodb mongorestore /tmp/restore
```

## Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Hoặc dùng script
make update  # Linux/Mac
.\deploy.ps1 -Action prod -Build  # Windows
```

## Tài liệu chi tiết

- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Hướng dẫn deploy chi tiết
- [README.md](./README.md) - Thông tin project
- [Docker Documentation](https://docs.docker.com/)

## Tips

1. **Development**: Sử dụng `docker-compose.yml` (không có nginx reverse proxy)
2. **Production**: Sử dụng `docker-compose.prod.yml` (có nginx, optimized)
3. **Logs**: Luôn check logs khi có lỗi: `docker-compose logs -f`
4. **Backup**: Backup trước khi update hoặc thay đổi lớn
5. **Resources**: Monitor resource usage với `docker stats`

## Cần trợ giúp?

```bash
# Windows
.\deploy.ps1 -Help

# Linux/Mac
make help

# Docker Compose
docker-compose --help
```

## Checklist Sau Deploy

- [ ] Tất cả containers đang chạy: `docker-compose ps`
- [ ] Health checks pass: `curl http://localhost:5000/health`
- [ ] Frontend accessible: http://localhost:3000
- [ ] Backend API working: http://localhost:5000/api
- [ ] Databases connected (check logs)
- [ ] Backup được cấu hình
- [ ] Monitoring được setup