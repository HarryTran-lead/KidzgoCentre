# Dependencies & Third-party Tools Documentation

## Frontend Dependencies

### Framework & Core
| Package | Version | Purpose | Link |
|---------|---------|---------|------|
| next | ^16.1.1 | React framework for production | https://nextjs.org |
| react | 19.2.0 | UI library | https://react.dev |
| react-dom | 19.2.0 | React DOM bindings | https://react.dev |
| typescript | ^5.9.3 | Type safety | https://www.typescriptlang.org |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4 | Utility-first CSS framework |
| @tailwindcss/postcss | ^4 | PostCSS plugin for Tailwind |
| @mui/material | ^7.3.4 | Material Design components |
| @emotion/react | ^11.14.0 | CSS-in-JS styling |
| @emotion/styled | ^11.14.1 | Styled components |
| lightswind | ^3.1.20 | Custom UI component library |
| lucide-react | ^0.552.0 | Icon library |
| styled-components | ^6.1.19 | CSS-in-JS library |

### Internationalization (i18n)
| Package | Version | Purpose |
|---------|---------|---------|
| next-intl | ^4.4.0 | Internationalization for Next.js |

### Form & Input
| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.66.0 | Performant forms library |
| input-otp | ^1.4.2 | OTP input component |
| react-day-picker | ^9.12.0 | Date picker component |

### Data & State Management
| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.13.2 | HTTP client |
| @vercel/blob | ^2.3.3 | File storage integration |

### Animation & Graphics
| Package | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^12.36.0 | Animation library |
| gsap | ^3.14.2 | Advanced animations |
| @react-three/fiber | ^9.4.2 | React renderer for Three.js |
| @react-three/drei | ^10.7.7 | Useful helpers for Three.js |
| react-flip-toolkit | ^7.2.4 | Flip animation library |
| canvas-confetti | ^1.9.4 | Confetti animations |
| cobe | ^0.6.5 | 3D globe |
| simplex-noise | ^4.0.3 | Noise generation |
| ogl | ^1.0.11 | WebGL library |
| @tsparticles/react | ^3.0.0 | Particle effects |
| @tsparticles/slim | ^3.9.1 | Slim particle library |

### UI Components
| Package | Version | Purpose |
|---------|---------|---------|
| @headlessui/react | ^2.2.9 | Headless UI components |
| embla-carousel-react | ^8.6.0 | Carousel component |
| swiper | ^12.0.3 | Touch slider |
| react-resizable-panels | ^3.0.6 | Resizable panel layout |
| recharts | ^3.6.0 | Charts & graphs |

### Code Display & Syntax Highlighting
| Package | Version | Purpose |
|---------|---------|---------|
| react-syntax-highlighter | ^16.1.0 | Syntax highlighting |
| @types/react-syntax-highlighter | ^15.5.13 | TypeScript types |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| clsx | ^2.1.1 | Conditional className utility |
| date-fns | ^4.1.0 | Date utility library |
| xlsx | ^0.18.5 | Excel file handling |
| react-router-dom | ^7.9.5 | Routing (supplementary) |
| react-icons | ^5.5.0 | Icon library |

### Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9 | Code linting |
| eslint-config-next | 16.0.1 | Next.js ESLint config |
| husky | ^9.1.7 | Git hooks |
| vitest | ^2.1.8 | Testing framework |
| @types/node | ^20.19.24 | Node.js types |
| @types/react | ^18.3.27 | React types |
| @types/react-dom | ^18.3.7 | React DOM types |
| @types/canvas-confetti | ^1.9.0 | Canvas confetti types |
| baseline-browser-mapping | ^2.9.11 | Browser mapping |

## Backend Dependencies (Typical .NET Stack)

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| .NET | 8.0+ | Framework runtime |
| ASP.NET Core | 8.0+ | Web API framework |
| Entity Framework Core | 8.0+ | ORM |

### Database
| Package | Version | Purpose |
|---------|---------|---------|
| Microsoft.EntityFrameworkCore | 8.0+ | ORM framework |
| Microsoft.EntityFrameworkCore.SqlServer | 8.0+ | SQL Server provider |
| Dapper | 2.0+ | Micro ORM (optional) |

### Authentication & Security
| Package | Version | Purpose |
|---------|---------|---------|
| System.IdentityModel.Tokens.Jwt | 7.0+ | JWT handling |
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0+ | JWT authentication |
| BCrypt.Net-Next | 4.0+ | Password hashing |

### API & Communication
| Package | Version | Purpose |
|---------|---------|---------|
| Microsoft.AspNetCore.Mvc | 8.0+ | Web API |
| Newtonsoft.Json | 13.0+ | JSON serialization |
| System.Text.Json | 8.0+ | Modern JSON (built-in) |
| RestSharp | 107.0+ | HTTP client |
| HttpClient | (built-in) | HTTP client |

### Logging & Monitoring
| Package | Version | Purpose |
|---------|---------|---------|
| Serilog | 3.0+ | Structured logging |
| Serilog.Sinks.File | 5.0+ | File logging |
| Serilog.Sinks.Console | 5.0+ | Console logging |
| Application Insights | (optional) | Azure monitoring |

### Validation & Error Handling
| Package | Version | Purpose |
|---------|---------|---------|
| FluentValidation | 11.0+ | Validation library |
| ErrorHandling | (custom) | Error handling middleware |

### File Storage
| Package | Version | Purpose |
|---------|---------|---------|
| Azure.Storage.Blobs | 12.0+ | Azure Blob Storage |
| Vercel.Blob | (API integration) | Vercel Blob Storage |

### Caching
| Package | Version | Purpose |
|---------|---------|---------|
| StackExchange.Redis | 2.0+ | Redis client |
| Microsoft.Extensions.Caching.StackExchangeRedis | 8.0+ | Redis caching |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| xUnit | 2.6+ | Testing framework |
| Moq | 4.18+ | Mocking library |
| FluentAssertions | 6.0+ | Assertion library |

## System Requirements

### Operating System
```
✓ Windows Server 2016 / 2019 / 2022
✓ Ubuntu 18.04 LTS / 20.04 LTS / 22.04 LTS
✓ CentOS 7 / 8
✓ macOS 11+
✓ Docker (any OS with Docker support)
```

### Runtime & SDKs
```
✓ Node.js 18.x / 20.x (Frontend)
✓ npm 9.x+ (Frontend)
✓ .NET SDK 8.0+ (Backend)
✓ SQL Server 2019 / 2022 or Express Edition
```

### Development Tools
```
✓ Visual Studio Code / Visual Studio 2022
✓ Git 2.0+
✓ Docker & Docker Compose (optional)
✓ npm / dotnet CLI
```

## Third-party Services Integration

### 1. Vercel Blob Storage
```
Purpose: File storage & CDN
Endpoint: https://blob.vercel-storage.com
Auth: API Token (NEXT_PUBLIC_VERCEL_BLOB_TOKEN)
Pricing: Pay-as-you-go
Documentation: https://vercel.com/docs/storage/vercel-blob
```

**Configuration:**
```env
NEXT_PUBLIC_VERCEL_BLOB_TOKEN=your_token_here
```

**Usage:**
```typescript
import { put, get, del } from '@vercel/blob';

// Upload
const blob = await put('file.pdf', file, { access: 'private' });

// Download
const response = await fetch(blob.url);

// Delete
await del(blob.url);
```

### 2. Zalo OTP Service
```
Purpose: SMS OTP verification
Provider: Zalo
Endpoint: https://api.zalo.me
Auth: API Key + Secret
Documentation: https://developers.zalo.me/docs
```

**Configuration:**
```env
NEXT_PUBLIC_ZALO_OTP_API_KEY=your_key
NEXT_PUBLIC_ZALO_OTP_SECRET=your_secret
NEXT_PUBLIC_ZALO_PHONE_PREFIX=84
```

### 3. Google Analytics 4
```
Purpose: Website analytics & tracking
Provider: Google
Endpoint: https://www.google-analytics.com/collect
Auth: Tracking ID (GTAG)
Documentation: https://developers.google.com/analytics
```

**Configuration:**
```env
NEXT_PUBLIC_GTAG=G-XXXXXXXXXX
```

### 4. Email Service (SendGrid / Gmail)
```
Purpose: Email notifications
Providers: SendGrid, Gmail, AWS SES
Documentation: 
  - SendGrid: https://sendgrid.com/docs
  - Gmail: https://support.google.com/mail/answer/7126229
  - AWS SES: https://docs.aws.amazon.com/ses/
```

**Configuration:**
```env
EMAIL_PROVIDER=sendgrid|gmail|ses
EMAIL_API_KEY=your_api_key
EMAIL_FROM=noreply@kidzgocentre.com
```

### 5. Azure (Optional)
```
Purpose: Cloud hosting & services
Services: App Service, SQL Database, Storage, CDN
Documentation: https://docs.microsoft.com/azure/
```

## Package Installation

### Frontend
```bash
# Install all dependencies
npm install

# Install specific package
npm install package-name

# Install specific version
npm install package-name@1.2.3

# Install dev dependency
npm install --save-dev package-name

# Update all packages
npm update

# Check outdated packages
npm outdated
```

### Backend
```bash
# Restore NuGet packages
dotnet restore

# Add NuGet package
dotnet add package PackageName

# Add specific version
dotnet add package PackageName --version 1.2.3

# Update package
dotnet package update PackageName

# List packages
dotnet package list
```

## Version Management

### Update Strategy
1. **Security updates** - Apply immediately
2. **Bug fixes** - Apply monthly
3. **Major versions** - Test thoroughly, plan migration

### Frontend Update Checklist
```bash
# 1. Check breaking changes
npm audit

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Test in browser
npm run dev

# 5. Commit changes
git commit -m "Update dependencies"
```

## Security Considerations

### Frontend
- Keep dependencies updated
- Use npm audit to find vulnerabilities
- Use integrity hashes for CDN resources
- Sanitize user inputs

### Backend
- Use HTTPS only
- Validate all inputs
- Keep SQL Server patched
- Use strong authentication (JWT with expiration)
- Enable logging & monitoring
- Use environment variables for secrets

## Performance Optimization

### Frontend
```javascript
// Code splitting
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false });

// Image optimization
<Image src={src} alt="" width={800} height={600} />

// SWR caching
const { data } = useSWR('/api/data', fetcher, { revalidateOnFocus: false });

// Bundle analysis
npm run build -- --analyze
```

### Backend
```csharp
// Database caching
services.AddStackExchangeRedisCache(options => {
    options.Configuration = Configuration.GetConnectionString("Redis");
});

// Query optimization
var users = await context.Users
    .AsNoTracking()
    .Where(u => u.Status == "Active")
    .ToListAsync();

// Pagination
var page = await context.Users
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

## Monitoring & Health Checks

```bash
# Frontend health
curl http://localhost:3000/health

# Backend health
curl http://localhost:5000/health

# Database health
curl http://localhost:5000/health/database
```

## Troubleshooting Common Issues

### npm Issues
```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### .NET Issues
```bash
# Clear cache
dotnet nuget locals all --clear

# Restore
dotnet restore --force
```

## Support Resources

| Resource | Link |
|----------|------|
| npm Docs | https://docs.npmjs.com |
| Node.js Docs | https://nodejs.org/docs |
| .NET Docs | https://docs.microsoft.com/dotnet |
| React Docs | https://react.dev |
| Next.js Docs | https://nextjs.org/docs |
| TypeScript Docs | https://www.typescriptlang.org/docs |
| Tailwind CSS Docs | https://tailwindcss.com/docs |

## License Information

- MIT: react, next, typescript, etc.
- Apache 2.0: @mui/material
- BSD: @emotion/react, @emotion/styled
- ISC: axios, clsx

See individual package LICENSE files for details.
