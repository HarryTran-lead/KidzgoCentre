# Installation & Configuration Guide

## Hệ thống Yêu cầu

### Phần cứng tối thiểu
- **CPU:** Intel i5 / AMD Ryzen 5 hoặc tương đương
- **RAM:** 8GB (khuyến nghị 16GB)
- **Storage:** 50GB SSD
- **Network:** Internet connection 10Mbps+

### Hệ điều hành
- Windows Server 2016 / 2019 / 2022
- Ubuntu 18.04 LTS / 20.04 LTS / 22.04 LTS
- macOS 11+

## Cài đặt Phần mềm

### 1. Backend Setup

#### Yêu cầu
- .NET 8.0 SDK trở lên
- SQL Server 2019 / 2022 hoặc SQL Server Express
- Visual Studio 2022 hoặc VS Code

#### Bước 1: Cài đặt .NET SDK
```bash
# Windows
winget install Microsoft.DotNet.SDK.8

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install dotnet-sdk-8.0

# macOS
brew install dotnet
```

#### Bước 2: Cài đặt SQL Server
```bash
# Windows - Download từ: https://www.microsoft.com/sql-server/

# Ubuntu
wget https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list
sudo apt-get install mssql-server
sudo /opt/mssql/bin/mssql-conf setup
```

#### Bước 3: Khôi phục Database
```bash
# Từ backup file
sqlcmd -S {SERVER} -U sa -P {PASSWORD} -Q "RESTORE DATABASE [KidzgoCentre] FROM DISK=N'{BACKUP_PATH}'"

# Hoặc chạy migration scripts
dotnet ef database update
```

#### Bước 4: Chạy Backend API
```bash
# Clone repository (nếu chưa có)
git clone https://github.com/kidzgocentre/backend.git
cd backend

# Cài đặt dependencies
dotnet restore

# Cấu hình appsettings.json
# Chỉnh sửa connection string, API keys, etc.

# Chạy ứng dụng
dotnet run

# Hoặc publish
dotnet publish -c Release -o ./publish
```

**Backend sẽ chạy tại:** http://localhost:5000 (or configured port)

### 2. Frontend Setup

#### Yêu cầu
- Node.js 18+ và npm 9+
- Git

#### Bước 1: Cài đặt Node.js
```bash
# Windows
winget install OpenJS.NodeJS

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node
```

#### Bước 2: Clone Project
```bash
git clone https://github.com/kidzgocentre/frontend.git KidzgoCentre
cd KidzgoCentre
```

#### Bước 3: Cài đặt Dependencies
```bash
npm install
# hoặc
npm ci  # Cài đặt chính xác theo package-lock.json
```

#### Bước 4: Cấu hình Environment Variables

Tạo file `.env.local` trong root project:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://103.146.22.206:5000/api

# Frontend URL
NEXT_PUBLIC_BASE_URL=https://rexenglishcentresr.vercel.app

# Development Mode
NEXT_PUBLIC_DEV_AUTO_LOGIN=0
NEXT_PUBLIC_DEV_ROLE=ADMIN

# i18n Configuration
NEXT_PUBLIC_DEFAULT_LOCALE=vi
NEXT_PUBLIC_LOCALES=vi,en

# Feature Flags
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=1
NEXT_PUBLIC_ENABLE_GAMIFICATION=1
NEXT_PUBLIC_ENABLE_HOMEWORK_AI=1

# Third-party Services
NEXT_PUBLIC_VERCEL_BLOB_TOKEN=your_blob_token_here
NEXT_PUBLIC_GTAG=your_google_analytics_id
```

#### Bước 5: Chạy Development Server
```bash
npm run dev

# Ứng dụng sẽ chạy tại http://localhost:3000
```

#### Bước 6: Build Production
```bash
npm run build
npm start
```

## Cấu hình Chi tiết

### Backend Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=KidzgoCentre;User Id=sa;Password=YOUR_PASSWORD;"
  },
  "Jwt": {
    "SecretKey": "your-secret-key-min-32-characters",
    "Issuer": "kidzgocentre.com",
    "Audience": "kidzgocentre-users",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "ApiSettings": {
    "BaseUrl": "https://api.kidzgocentre.com",
    "Port": 5000,
    "EnableCors": true,
    "AllowedOrigins": [
      "https://rexenglishcentresr.vercel.app",
      "http://localhost:3000"
    ]
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "FromEmail": "noreply@kidzgocentre.com",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password"
  },
  "Storage": {
    "Type": "AzureBlobStorage",
    "ConnectionString": "DefaultEndpointsProtocol=https;...",
    "ContainerName": "kidzgocentre-storage"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

### Frontend Environment Configuration

#### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_AUTO_LOGIN=1
```

#### Staging (.env.staging)
```env
NEXT_PUBLIC_API_URL=https://api-staging.kidzgocentre.com/api
NEXT_PUBLIC_BASE_URL=https://staging.kidzgocentre.com
NEXT_PUBLIC_DEV_AUTO_LOGIN=0
```

#### Production (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.kidzgocentre.com/api
NEXT_PUBLIC_BASE_URL=https://rexenglishcentresr.vercel.app
NEXT_PUBLIC_DEV_AUTO_LOGIN=0
```

## Cấu hình Third-party Services

### 1. Vercel Blob Storage

```javascript
// lib/storage.ts
import { put, get, del } from '@vercel/blob';

export async function uploadFile(file: File) {
  const blob = await put(file.name, file, { access: 'private' });
  return blob.url;
}
```

**Cấu hình:**
- Tạo token tại: https://vercel.com/account/tokens
- Lưu vào environment variable: `NEXT_PUBLIC_VERCEL_BLOB_TOKEN`

### 2. Zalo OTP Integration

```env
NEXT_PUBLIC_ZALO_OTP_API_KEY=your_zalo_api_key
NEXT_PUBLIC_ZALO_OTP_SECRET=your_zalo_secret
```

**Hướng dẫn:** https://developers.zalo.me/docs

### 3. Google Analytics

```env
NEXT_PUBLIC_GTAG=G-XXXXXXXXXX
```

Thêm vào `app/layout.tsx`:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout() {
  return (
    <html>
      <body>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GTAG} />
      </body>
    </html>
  )
}
```

### 4. Email Configuration

**Sử dụng Gmail:**
1. Bật 2-factor authentication
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Lưu vào `appsettings.json`

**Hoặc sử dụng SendGrid:**
```json
{
  "Email": {
    "Provider": "SendGrid",
    "ApiKey": "your_sendgrid_api_key"
  }
}
```

## Database Configuration

### Connection String Format
```
Server=YOUR_SERVER;Database=KidzgoCentre;User Id=USERNAME;Password=PASSWORD;Encrypt=true;TrustServerCertificate=false;
```

### Kiểm tra kết nối
```bash
# Sử dụng sqlcmd
sqlcmd -S YOUR_SERVER -U USERNAME -P PASSWORD

# Trong SQL Server Management Studio
# Test connection trước khi lưu
```

### Khởi tạo Database
```bash
# Nếu sử dụng Entity Framework Core
dotnet ef migrations add InitialCreate
dotnet ef database update

# Hoặc chạy SQL scripts
sqlcmd -S YOUR_SERVER -U USERNAME -i "scripts/InitialSetup.sql"
```

## Kiểm tra Cài đặt

### Backend Health Check
```bash
curl http://localhost:5000/health
# Response: { "status": "healthy" }
```

### Frontend Health Check
```bash
curl http://localhost:3000
# Response: HTML page
```

### Database Connection Test
```bash
# Backend
curl http://localhost:5000/api/health/database
# Response: { "database": "connected", "tables": 10 }
```

## Troubleshooting

### Vấn đề: Port đã bị sử dụng
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Linux/macOS
lsof -i :5000
kill -9 {PID}
```

### Vấn đề: Database connection failed
```bash
# Kiểm tra SQL Server service
# Windows: Services → MSSQLSERVER → Start

# Linux
sudo systemctl start mssql-server
sudo systemctl status mssql-server
```

### Vấn đề: Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Vấn đề: CORS errors
- Kiểm tra `appsettings.json` - AllowedOrigins
- Kiểm tra `next.config.ts` - headers configuration

## Deployment

### Vercel Deployment (Frontend)
```bash
# Connect GitHub repo
# Vercel automatically deploys on push to main

# Manual deployment
vercel --prod
```

### Docker Deployment

#### Dockerfile (Backend)
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
CMD ["dotnet", "KidzgoCentre.Api.dll"]
```

#### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## Performance Tuning

### Frontend
- Enable SWR caching
- Code splitting
- Image optimization
- CSS/JS minification

### Backend
- Database indexing
- Query optimization
- Caching strategy
- Load balancing

## Security Checklist

- [ ] Thay đổi tất cả default passwords
- [ ] Bật HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable logging & monitoring
- [ ] Regular backups
- [ ] Security updates
- [ ] Rate limiting
- [ ] Input validation

## Support & Documentation

- API Documentation: http://localhost:5000/swagger
- Frontend Documentation: See [README.md](README.md)
- Database Documentation: See [DATABASE_SETUP.md](DATABASE_SETUP.md)

## Liên hệ

Email: support@kidzgocentre.com
Hotline: +84-XXX-XXX-XXXX
