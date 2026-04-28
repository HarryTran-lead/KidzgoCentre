# API Configuration & Integration Guide

## Backend API Configuration

### API Base URL
```
Development:  http://localhost:5000/api
Staging:      https://api-staging.kidzgocentre.com/api
Production:   https://api.kidzgocentre.com/api
Demo:         http://103.146.22.206:5000/api
```

### API Port Configuration

#### Development
```
Port: 5000 (HTTP)
HTTPS Port: 5001
```

#### Production
```
Port: 443 (HTTPS)
Reverse Proxy: Nginx / IIS
Load Balancer: Active
```

## Frontend API Configuration

### Environment Variables

#### .env.local (Development)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Developer Mode
NEXT_PUBLIC_DEV_AUTO_LOGIN=1
NEXT_PUBLIC_DEV_ROLE=ADMIN

# Services
NEXT_PUBLIC_VERCEL_BLOB_TOKEN=dev_token_here
```

#### .env.production
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.kidzgocentre.com/api
NEXT_PUBLIC_BASE_URL=https://rexenglishcentresr.vercel.app

# Developer Mode
NEXT_PUBLIC_DEV_AUTO_LOGIN=0

# Services
NEXT_PUBLIC_VERCEL_BLOB_TOKEN=prod_token_here
NEXT_PUBLIC_GTAG=G-PRODUCTION_ID
```

## Authentication

### JWT Token Configuration

#### Token Generation
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "Teacher",
  "iat": 1234567890,
  "exp": 1234571490
}
```

#### Token Storage
- **Access Token**: In-memory (httpOnly cookie for production)
- **Refresh Token**: Secure httpOnly cookie
- **Expiration**: 1 hour (access), 7 days (refresh)

### Login Flow
```
1. User submits username + password
   POST /api/auth/login

2. Backend validates credentials
   - Query database
   - Verify password hash
   - Generate tokens

3. Response with tokens
   {
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc...",
     "user": {...}
   }

4. Client stores tokens
   - Access token: Cookie (httpOnly)
   - Refresh token: Cookie (httpOnly, Secure)

5. Include in requests
   Authorization: Bearer {accessToken}
```

### Token Refresh Flow
```
1. Access token expires
2. Frontend detects 401 response
3. Calls POST /api/auth/refresh-token
   - Sends refresh token
4. Backend validates refresh token
5. Issues new access token
6. Retry original request
```

## API Endpoints Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login

Request:
{
  "username": "admin",
  "password": "Admin@123456"
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "Admin"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /api/auth/logout

Headers:
Authorization: Bearer {accessToken}

Response (200):
{
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/auth/me

Headers:
Authorization: Bearer {accessToken}

Response (200):
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "Admin",
  "createdDate": "2026-01-01T10:00:00Z"
}
```

#### Change Password
```http
POST /api/auth/change-password

Headers:
Authorization: Bearer {accessToken}

Request:
{
  "oldPassword": "Old@123456",
  "newPassword": "New@234567"
}

Response (200):
{
  "message": "Password changed successfully"
}
```

#### Forgot Password
```http
POST /api/auth/forget-password

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Reset link sent to email"
}
```

#### Reset Password
```http
POST /api/auth/reset-password

Request:
{
  "token": "reset_token_from_email",
  "newPassword": "New@234567"
}

Response (200):
{
  "message": "Password reset successfully"
}
```

### Students Endpoints

#### Get My Classes
```http
GET /api/students/classes

Headers:
Authorization: Bearer {accessToken}

Response (200):
[
  {
    "classId": 1,
    "className": "Basic English A1",
    "teacherName": "Mr. John",
    "schedule": "Mon, Wed, Fri - 18:00-19:30",
    "level": "A1",
    "status": "Active"
  }
]
```

#### Get My Homework
```http
GET /api/students/homework/my

Headers:
Authorization: Bearer {accessToken}

Response (200):
[
  {
    "homeworkId": 1,
    "title": "Present yourself",
    "description": "Prepare a 2-minute introduction",
    "dueDate": "2026-05-10T23:59:59Z",
    "status": "Pending",
    "className": "Basic English A1"
  }
]
```

#### Submit Homework
```http
POST /api/students/homework/{homeworkId}/submit

Headers:
Authorization: Bearer {accessToken}

Request:
{
  "content": "My submission content here",
  "fileUrl": "https://blob.vercel-storage.com/file.pdf"
}

Response (201):
{
  "submissionId": 1,
  "homeworkId": 1,
  "studentId": 1,
  "submissionDate": "2026-05-09T15:30:00Z",
  "status": "Submitted"
}
```

#### Get Homework Feedback
```http
GET /api/students/homework/{homeworkId}/feedback

Headers:
Authorization: Bearer {accessToken}

Response (200):
{
  "homeworkId": 1,
  "feedbackId": 1,
  "score": 8.5,
  "feedback": "Good work! Keep practicing speaking.",
  "givenDate": "2026-05-10T10:00:00Z",
  "teacherName": "Mr. John"
}
```

### Teacher Endpoints

#### Create Homework
```http
POST /api/teachers/homework/create

Headers:
Authorization: Bearer {accessToken}

Request:
{
  "classId": 1,
  "title": "Present yourself",
  "description": "Prepare a 2-minute introduction",
  "dueDate": "2026-05-10T23:59:59Z",
  "content": "Homework content here"
}

Response (201):
{
  "homeworkId": 1,
  "classId": 1,
  "title": "Present yourself",
  "status": "Published",
  "createdDate": "2026-05-09T10:00:00Z"
}
```

#### Grade Homework
```http
POST /api/teachers/homework/{submissionId}/grade

Headers:
Authorization: Bearer {accessToken}

Request:
{
  "score": 8.5,
  "feedback": "Good work! Keep practicing."
}

Response (200):
{
  "submissionId": 1,
  "score": 8.5,
  "feedback": "Good work! Keep practicing.",
  "gradedDate": "2026-05-10T10:00:00Z"
}
```

#### Record Attendance
```http
POST /api/teachers/attendance/record

Headers:
Authorization: Bearer {accessToken}

Request:
{
  "sessionId": 1,
  "attendanceRecords": [
    {
      "studentId": 1,
      "status": "Present"
    },
    {
      "studentId": 2,
      "status": "Absent"
    }
  ]
}

Response (200):
{
  "message": "Attendance recorded successfully",
  "recordedCount": 2
}
```

## CORS Configuration

### Allowed Origins
```
Development:
  - http://localhost:3000
  - http://localhost:3001
  - http://127.0.0.1:3000

Production:
  - https://rexenglishcentresr.vercel.app
  - https://app.kidzgocentre.com
```

### CORS Headers
```
Access-Control-Allow-Origin: [allowed origin]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Rate Limiting

### Configuration
```
Requests per minute: 60 (public), 300 (authenticated)
Requests per hour: 1000 (public), 5000 (authenticated)
Burst limit: 10 requests per second
```

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

## Error Handling

### Error Response Format
```json
{
  "code": "UNAUTHORIZED",
  "message": "User is not authorized to access this resource",
  "statusCode": 401,
  "timestamp": "2026-05-09T10:00:00Z"
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Authenticated but not authorized |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

## Security Headers

### Required Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## API Testing

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Classes
```bash
curl -X GET http://localhost:5000/api/students/classes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection
Import the Postman collection: `/docs/postman_collection.json`

### API Monitoring

#### Health Check Endpoint
```http
GET /health

Response (200):
{
  "status": "healthy",
  "timestamp": "2026-05-09T10:00:00Z",
  "version": "1.0.0"
}
```

#### Database Health Check
```http
GET /health/database

Response (200):
{
  "database": "connected",
  "tables": 10,
  "lastBackup": "2026-05-09T00:00:00Z"
}
```

## API Versioning

### Current Version
- **Version**: 1.0
- **Endpoint Format**: `/api/v1/...`

### Future Versions
```
/api/v1/auth/login
/api/v2/auth/login (when available)
```

## Caching Strategy

### Cache Headers
```
Cache-Control: no-cache, no-store, must-revalidate
ETag: "123abc456def"
Last-Modified: Wed, 09 May 2026 10:00:00 GMT
```

### Cached Endpoints
- `GET /api/classes` - 5 minutes
- `GET /api/teachers` - 10 minutes
- `GET /api/students` - Conditional

## Webhooks (Optional)

### Supported Events
```
homework.submitted
homework.graded
attendance.recorded
user.registered
```

### Webhook Configuration
```json
{
  "eventType": "homework.submitted",
  "url": "https://your-app.com/webhooks/homework",
  "active": true,
  "secret": "webhook_secret_key"
}
```

## API Documentation Generation

### Swagger/OpenAPI
```
Development: http://localhost:5000/swagger
Production: https://api.kidzgocentre.com/swagger
```

## Support

For API issues:
- Email: api-support@kidzgocentre.com
- Slack: #api-support
- Status Page: https://status.kidzgocentre.com
