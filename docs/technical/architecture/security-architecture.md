# Security Architecture

## Overview

Questlog implements a comprehensive security architecture designed to protect user data, ensure system integrity, and maintain compliance with privacy regulations. The security model follows defense-in-depth principles with multiple layers of protection.

## Security Principles

### Core Security Principles
- **Zero Trust**: Never trust, always verify
- **Least Privilege**: Minimal access required for functionality
- **Defense in Depth**: Multiple security layers
- **Privacy by Design**: Privacy built into system architecture
- **Security by Default**: Secure configurations by default

### Security Objectives
- **Confidentiality**: Protect sensitive data from unauthorized access
- **Integrity**: Ensure data accuracy and consistency
- **Availability**: Maintain system availability and performance
- **Privacy**: Protect user privacy and comply with regulations

## Authentication Architecture

### Multi-Factor Authentication (MFA)

#### Primary Authentication Methods
1. **Email/Password**: Traditional username/password authentication
2. **OAuth 2.0**: Social login (Google, GitHub, Microsoft)
3. **Magic Links**: Passwordless authentication via email
4. **TOTP**: Time-based one-time passwords (future)

#### MFA Implementation
```typescript
interface AuthenticationConfig {
  primaryMethod: 'password' | 'oauth' | 'magic_link';
  mfaRequired: boolean;
  mfaMethods: ('totp' | 'sms' | 'email')[];
  sessionDuration: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
}
```

### JWT Token Management

#### Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "iss": "questlog.com",
    "aud": "questlog-api",
    "iat": 1642248600,
    "exp": 1642252200,
    "nbf": 1642248600,
    "jti": "jwt_123456789",
    "scope": ["read:quests", "write:quests"],
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "subscription_tier": "premium"
    }
  }
}
```

#### Token Lifecycle
- **Access Token**: 1 hour expiration
- **Refresh Token**: 30 days expiration
- **Token Rotation**: Automatic refresh token rotation
- **Token Revocation**: Immediate revocation on logout/compromise

#### Token Security
```typescript
interface TokenSecurity {
  algorithm: 'RS256'; // Asymmetric signing
  keyRotation: '30d'; // Key rotation schedule
  tokenStorage: 'httpOnly_cookie'; // Secure storage
  csrfProtection: true; // CSRF token validation
}
```

### Session Management

#### Session Configuration
```typescript
interface SessionConfig {
  sessionStore: 'redis';
  sessionTimeout: 3600; // seconds
  sessionRenewal: true;
  concurrentSessions: 5; // max concurrent sessions
  sessionCleanup: '1h'; // cleanup interval
}
```

#### Session Security
- **Secure Cookies**: HttpOnly, Secure, SameSite flags
- **Session Binding**: IP address and user agent binding
- **Session Monitoring**: Anomaly detection for suspicious activity
- **Automatic Logout**: Inactivity timeout and security events

## Authorization Architecture

### Role-Based Access Control (RBAC)

#### User Roles
```typescript
enum UserRole {
  FREE_USER = 'free_user',
  PREMIUM_USER = 'premium_user',
  ENTERPRISE_USER = 'enterprise_user',
  ADMIN = 'admin',
  SYSTEM = 'system'
}
```

#### Permission System
```typescript
interface Permission {
  resource: string; // 'quests', 'projects', 'analytics'
  action: string;   // 'create', 'read', 'update', 'delete'
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in';
  value: any;
}
```

#### Permission Matrix
| Role | Quests | Projects | Analytics | AI Features | Team Features |
|------|--------|----------|-----------|-------------|---------------|
| Free User | CRUD (own) | CRUD (own) | Read (own) | Limited | None |
| Premium User | CRUD (own) | CRUD (own) | Full (own) | Full | None |
| Enterprise User | CRUD (own) | CRUD (own) | Full (own) | Full | Limited |
| Admin | CRUD (all) | CRUD (all) | Full (all) | Full | Full |

### Resource-Level Authorization

#### Quest Authorization
```typescript
interface QuestAuthorization {
  owner: string; // user_id
  sharedWith: string[]; // user_ids
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
}
```

#### Project Authorization
```typescript
interface ProjectAuthorization {
  owner: string;
  members: ProjectMember[];
  visibility: 'private' | 'team' | 'public';
  permissions: ProjectPermissions;
}

interface ProjectMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
}
```

### API Authorization

#### Endpoint Protection
```typescript
interface EndpointSecurity {
  authentication: boolean;
  authorization: Permission[];
  rateLimit: RateLimitConfig;
  audit: boolean;
}
```

#### Authorization Middleware
```typescript
const authorize = (requiredPermissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const hasPermission = await checkPermissions(user, requiredPermissions);
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied'
      });
    }
    
    next();
  };
};
```

## Data Protection

### Encryption Strategy

#### Data at Rest
```typescript
interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keySource: 'AWS_KMS';
  keyRotation: '90d';
  encryptedFields: string[];
}
```

#### Encrypted Data Fields
- **PII Data**: Email addresses, names, phone numbers
- **Sensitive Data**: Passwords (hashed), API keys
- **User Content**: Quest descriptions, notes
- **Analytics Data**: User behavior patterns

#### Database Encryption
```sql
-- Column-level encryption for sensitive data
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) ENCRYPTED,
    phone VARCHAR(20) ENCRYPTED,
    preferences JSONB ENCRYPTED
);
```

#### File Storage Encryption
```typescript
interface FileEncryption {
  clientSide: boolean; // Client-side encryption for sensitive files
  serverSide: boolean; // Server-side encryption for all files
  keyManagement: 'AWS_KMS';
  encryptionAlgorithm: 'AES-256-GCM';
}
```

### Data in Transit

#### TLS Configuration
```typescript
interface TLSConfig {
  version: '1.3';
  cipherSuites: string[];
  certificateAuthority: 'Let\'s Encrypt';
  certificateRenewal: 'auto';
  hsts: {
    enabled: true;
    maxAge: 31536000; // 1 year
    includeSubDomains: true;
    preload: true;
  };
}
```

#### API Security Headers
```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

### Data Privacy

#### GDPR Compliance

##### Data Processing Principles
- **Lawfulness**: Clear legal basis for data processing
- **Purpose Limitation**: Data used only for specified purposes
- **Data Minimization**: Minimal data collection
- **Accuracy**: Accurate and up-to-date data
- **Storage Limitation**: Limited retention periods
- **Integrity and Confidentiality**: Secure data handling

##### User Rights Implementation
```typescript
interface UserRights {
  rightToAccess: boolean;      // Data export
  rightToRectification: boolean; // Data correction
  rightToErasure: boolean;     // Right to be forgotten
  rightToPortability: boolean; // Data portability
  rightToObject: boolean;      // Processing objection
  rightToRestriction: boolean; // Processing restriction
}
```

#### Data Anonymization
```typescript
interface AnonymizationConfig {
  fields: {
    email: 'hash';      // Hash email addresses
    name: 'pseudonym';  // Replace with pseudonyms
    ip: 'mask';         // Mask IP addresses
    location: 'generalize'; // Generalize location data
  };
  retention: {
    raw: '30d';         // Raw data retention
    anonymized: '2y';   // Anonymized data retention
  };
}
```

## Network Security

### Network Architecture

#### VPC Configuration
```yaml
vpc:
  cidr: 10.0.0.0/16
  subnets:
    public:
      - cidr: 10.0.1.0/24
        az: us-east-1a
      - cidr: 10.0.2.0/24
        az: us-east-1b
    private:
      - cidr: 10.0.10.0/24
        az: us-east-1a
      - cidr: 10.0.11.0/24
        az: us-east-1b
```

#### Security Groups
```yaml
security_groups:
  web_tier:
    inbound:
      - port: 443
        source: 0.0.0.0/0
        protocol: tcp
    outbound:
      - port: 0-65535
        destination: 0.0.0.0/0
        protocol: tcp
  
  application_tier:
    inbound:
      - port: 3000
        source: web_tier
        protocol: tcp
    outbound:
      - port: 5432
        destination: database_tier
        protocol: tcp
```

### DDoS Protection

#### Cloudflare Integration
```typescript
interface DDoSProtection {
  provider: 'Cloudflare';
  features: {
    rateLimiting: true;
    botProtection: true;
    waf: true;
    ddosMitigation: true;
  };
  rules: RateLimitRule[];
}
```

#### Rate Limiting Configuration
```typescript
interface RateLimitConfig {
  authentication: {
    requests: 5;
    window: '1m';
    blockDuration: '15m';
  };
  api: {
    requests: 100;
    window: '1m';
    burst: 200;
  };
  ai: {
    requests: 20;
    window: '1m';
    burst: 50;
  };
}
```

## Application Security

### Input Validation

#### Validation Framework
```typescript
import { z } from 'zod';

const QuestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  dueDate: z.date().min(new Date()).optional(),
  priority: z.number().min(1).max(5),
  estimatedTimeMinutes: z.number().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const validateQuest = (data: unknown) => {
  return QuestSchema.parse(data);
};
```

#### Sanitization
```typescript
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};
```

### SQL Injection Prevention

#### Parameterized Queries
```typescript
// Using Prisma ORM for type-safe queries
const getQuestsByUser = async (userId: string) => {
  return await prisma.quest.findMany({
    where: {
      userId: userId,
      status: 'active'
    },
    include: {
      category: true,
      tags: true
    }
  });
};
```

#### Query Validation
```typescript
const validateQueryParams = (params: any) => {
  const schema = z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    sortBy: z.enum(['createdAt', 'dueDate', 'priority']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
  
  return schema.parse(params);
};
```

### XSS Prevention

#### Content Security Policy
```typescript
const cspPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.questlog.com'],
  'frame-ancestors': ["'none'"],
};
```

#### XSS Protection Headers
```typescript
const xssHeaders = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};
```

## Security Monitoring

### Logging and Monitoring

#### Security Event Logging
```typescript
interface SecurityEvent {
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'system';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource?: string;
  outcome: 'success' | 'failure' | 'blocked';
  metadata: Record<string, any>;
}
```

#### Log Aggregation
```typescript
interface LoggingConfig {
  provider: 'DataDog';
  logLevel: 'info';
  retention: '90d';
  alerting: {
    failedLogins: 5; // Alert after 5 failed logins
    suspiciousActivity: true;
    dataBreach: true;
  };
}
```

### Intrusion Detection

#### Anomaly Detection
```typescript
interface AnomalyDetection {
  loginPatterns: {
    timeBased: boolean;
    locationBased: boolean;
    deviceBased: boolean;
  };
  behaviorAnalysis: {
    questCreation: boolean;
    apiUsage: boolean;
    dataAccess: boolean;
  };
  thresholds: {
    loginAttempts: 10; // per hour
    apiRequests: 1000; // per minute
    dataExports: 5; // per day
  };
}
```

#### Security Alerts
```typescript
interface SecurityAlert {
  type: 'brute_force' | 'data_breach' | 'suspicious_activity' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: string[];
  recommendedActions: string[];
  timestamp: Date;
}
```

## Incident Response

### Security Incident Response Plan

#### Response Team
- **Security Lead**: Overall incident coordination
- **Engineering Lead**: Technical response and recovery
- **Legal/Compliance**: Regulatory and legal considerations
- **Communications**: Customer and stakeholder communication

#### Response Phases
1. **Detection**: Identify and validate security incident
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate and contain the threat
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve processes

#### Response Procedures
```typescript
interface IncidentResponse {
  detection: {
    automated: boolean;
    manual: boolean;
    escalation: string[];
  };
  containment: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  communication: {
    internal: string[];
    customers: string[];
    regulators: string[];
  };
}
```