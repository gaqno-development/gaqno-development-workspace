# gaqno-shop Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform gaqno-shop from its current MVP state to a production-ready B2C e-commerce platform with authentication, shipping integration, loyalty program, and analytics.

**Architecture:** Monolithic NestJS backend with Next.js frontend, following gaqno ecosystem patterns. Each feature is implemented as a cohesive module with clear boundaries.

**Tech Stack:** NestJS, Next.js 15, PostgreSQL, Drizzle ORM, Redis, BullMQ, next-auth, react-i18next, MercadoPago, Correios API, Jadlog API

---

## Table of Contents

1. [Pre-Implementation Setup](#pre-implementation-setup)
2. [Phase 1: Foundation (Auth)](#phase-1-foundation-auth)
3. [Phase 2: Order Management](#phase-2-order-management)
4. [Phase 3: Shipping Integration](#phase-3-shipping-integration)
5. [Phase 4: Loyalty Program](#phase-4-loyalty-program)
6. [Phase 5: Analytics & Wishlist](#phase-5-analytics--wishlist)
7. [Phase 6: i18n & Production Polish](#phase-6-i18n--production-polish)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Checklist](#deployment-checklist)

---

## Pre-Implementation Setup

### Task 0.1: Verify Project Structure

**Files to check:**
- `gaqno-shop-service/` - NestJS backend
- `gaqno-shop/` - Next.js customer frontend
- `gaqno-shop-admin/` - Vite admin panel

**Verify each project has:**
```bash
cd gaqno-shop-service && npm install && npm run build
cd ../gaqno-shop && npm install && npm run build
cd ../gaqno-shop-admin && npm install && npm run build
```

All builds should succeed before proceeding.

### Task 0.2: Create Database Migration Infrastructure

**Create file:** `gaqno-shop-service/src/database/migrate.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed!');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**Add to package.json scripts:**
```json
{
  "scripts": {
    "migrate": "ts-node src/database/migrate.ts",
    "migrate:generate": "drizzle-kit generate"
  }
}
```

### Task 0.3: Install Shared Dependencies

**Backend dependencies:**
```bash
cd gaqno-shop-service
npm install @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt @types/bcrypt
npm install ioredis @nestjs/bullmq bullmq
npm install nodemailer @types/nodemailer
npm install axios xml2js @types/xml2js  # For Correios/Jadlog
```

**Frontend dependencies:**
```bash
cd gaqno-shop
npm install next-auth
npm install react-i18next i18next i18next-http-backend
npm install recharts
npm install @hookform/resolvers zod react-hook-form
npm install date-fns
```

**Admin dependencies:**
```bash
cd gaqno-shop-admin
npm install recharts
npm install @hookform/resolvers zod react-hook-form
npm install date-fns
```

### Task 0.4: Set Up Environment Variables

**Create:** `gaqno-shop-service/.env.example` additions:
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@gaqno.com.br
EMAIL_FROM_NAME=Gaqno Shop

# Correios API
CORREIOS_USUARIO=seu-usuario-correios
CORREIOS_SENHA=sua-senha-correios
CORREIOS_CODIGO_ADMINISTRATIVO=seu-codigo

# Jadlog API
JADLOG_TOKEN=seu-token-jadlog
JADLOG_CNPJ=seu-cnpj

# Loyalty Configuration
LOYALTY_DEFAULT_EARN_RATE=1.0
LOYALTY_POINT_VALUE_CENTS=1
```

**Create:** `gaqno-shop/.env.example` additions:
```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-min-32-characters

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook OAuth (optional)
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# API URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Phase 1: Foundation (Auth)

**Goal:** Implement complete customer authentication system with JWT tokens, email verification, and password reset.

**Estimated Duration:** 2 weeks

### Database Schema (Phase 1)

#### Task 1.1: Extend Customer Table

**File:** `gaqno-shop-service/src/database/schema.ts`

Add to existing schema (after customers table):

```typescript
// customer_sessions table
export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
  },
  (table) => ({
    tenantIdx: index("sessions_tenant_idx").on(table.tenantId),
    customerIdx: index("sessions_customer_idx").on(table.customerId),
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
  })
);

// customer_email_verifications table
export const customerEmailVerifications = pgTable(
  "customer_email_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    usedAt: timestamp("used_at"),
  },
  (table) => ({
    tenantIdx: index("email_verif_tenant_idx").on(table.tenantId),
    tokenIdx: uniqueIndex("email_verif_token_idx").on(table.token),
  })
);

// customer_password_resets table
export const customerPasswordResets = pgTable(
  "customer_password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    usedAt: timestamp("used_at"),
  },
  (table) => ({
    tenantIdx: index("password_reset_tenant_idx").on(table.tenantId),
    tokenIdx: uniqueIndex("password_reset_token_idx").on(table.token),
  })
);

// Type exports
export type CustomerSession = typeof customerSessions.$inferSelect;
export type CustomerEmailVerification = typeof customerEmailVerifications.$inferSelect;
export type CustomerPasswordReset = typeof customerPasswordResets.$inferSelect;
```

**Generate migration:**
```bash
cd gaqno-shop-service
npx drizzle-kit generate
```

#### Task 1.2: Create Auth Module Structure

**Create directory structure:**
```
gaqno-shop-service/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── verify-email.dto.ts
└── auth.service.spec.ts
```

#### Task 1.3: Implement Auth DTOs

**File:** `gaqno-shop-service/src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
  @Matches(/[0-9]/, { message: 'Senha deve conter pelo menos um número' })
  password: string;

  @IsString({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  firstName: string;

  @IsString({ message: 'Sobrenome é obrigatório' })
  @MinLength(2, { message: 'Sobrenome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Sobrenome deve ter no máximo 100 caracteres' })
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\) \d{5}-\d{4}$/, { message: 'Telefone inválido. Formato: (11) 99999-9999' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido. Formato: 123.456.789-00' })
  cpf?: string;
}
```

**File:** `gaqno-shop-service/src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'Senha é obrigatória' })
  password: string;
}
```

**File:** `gaqno-shop-service/src/auth/dto/forgot-password.dto.ts`

```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}
```

**File:** `gaqno-shop-service/src/auth/dto/reset-password.dto.ts`

```typescript
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token é obrigatório' })
  token: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
  @Matches(/[0-9]/, { message: 'Senha deve conter pelo menos um número' })
  newPassword: string;
}
```

**File:** `gaqno-shop-service/src/auth/dto/verify-email.dto.ts`

```typescript
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Token é obrigatório' })
  token: string;
}
```

#### Task 1.4: Implement Auth Service

**File:** `gaqno-shop-service/src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { customers, customerSessions, customerEmailVerifications, customerPasswordResets } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(tenantId: string, dto: RegisterDto) {
    const db = this.drizzle.db;

    // Check if email already exists
    const existingCustomer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        eq(customers.email, dto.email.toLowerCase())
      ),
    });

    if (existingCustomer) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create customer
    const [customer] = await db.insert(customers).values({
      tenantId,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      cpf: dto.cpf,
    }).returning();

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    await db.insert(customerEmailVerifications).values({
      tenantId,
      customerId: customer.id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(customer.email, verificationToken);

    // Generate tokens
    const tokens = await this.generateTokens(customer);

    return {
      customer: this.sanitizeCustomer(customer),
      ...tokens,
    };
  }

  async login(tenantId: string, dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const db = this.drizzle.db;

    // Find customer
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        eq(customers.email, dto.email.toLowerCase())
      ),
    });

    if (!customer || !customer.password) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Check if customer is active
    if (!customer.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    // Generate tokens
    const tokens = await this.generateTokens(customer, ipAddress, userAgent);

    return {
      customer: this.sanitizeCustomer(customer),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const db = this.drizzle.db;

    // Find session
    const session = await db.query.customerSessions.findFirst({
      where: and(
        eq(customerSessions.token, refreshToken),
        gt(customerSessions.expiresAt, new()),
      ),
      with: {
        customer: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Update last used
    await db.update(customerSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(customerSessions.id, session.id));

    // Generate new tokens
    const tokens = await this.generateTokens(session.customer);

    // Delete old session
    await db.delete(customerSessions).where(eq(customerSessions.id, session.id));

    return tokens;
  }

  async logout(refreshToken: string) {
    const db = this.drizzle.db;

    await db.delete(customerSessions)
      .where(eq(customerSessions.token, refreshToken));

    return { success: true };
  }

  async forgotPassword(tenantId: string, email: string) {
    const db = this.drizzle.db;

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        eq(customers.email, email.toLowerCase())
      ),
    });

    if (!customer) {
      // Don't reveal if email exists
      return { message: 'Se o email existir, você receberá um link de recuperação' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    await db.insert(customerPasswordResets).values({
      tenantId,
      customerId: customer.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    });

    // Send reset email
    await this.mailService.sendPasswordResetEmail(customer.email, resetToken);

    return { message: 'Se o email existir, você receberá um link de recuperação' };
  }

  async resetPassword(token: string, newPassword: string) {
    const db = this.drizzle.db;

    const resetRecord = await db.query.customerPasswordResets.findFirst({
      where: and(
        eq(customerPasswordResets.token, token),
        gt(customerPasswordResets.expiresAt, new Date()),
        isNull(customerPasswordResets.usedAt),
      ),
    });

    if (!resetRecord) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update customer password
    await db.update(customers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(customers.id, resetRecord.customerId));

    // Mark token as used
    await db.update(customerPasswordResets)
      .set({ usedAt: new Date() })
      .where(eq(customerPasswordResets.id, resetRecord.id));

    // Invalidate all existing sessions
    await db.delete(customerSessions)
      .where(eq(customerSessions.customerId, resetRecord.customerId));

    return { message: 'Senha alterada com sucesso' };
  }

  async verifyEmail(token: string) {
    const db = this.drizzle.db;

    const verification = await db.query.customerEmailVerifications.findFirst({
      where: and(
        eq(customerEmailVerifications.token, token),
        gt(customerEmailVerifications.expiresAt, new Date()),
        isNull(customerEmailVerifications.usedAt),
      ),
    });

    if (!verification) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    // Update customer
    await db.update(customers)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(customers.id, verification.customerId));

    // Mark token as used
    await db.update(customerEmailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(customerEmailVerifications.id, verification.id));

    return { message: 'Email verificado com sucesso' };
  }

  private async generateTokens(customer: any, ipAddress?: string, userAgent?: string) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      tenantId: customer.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = randomBytes(32).toString('hex');
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(refreshExpiresIn));

    // Store refresh token
    await this.drizzle.db.insert(customerSessions).values({
      tenantId: customer.tenantId,
      customerId: customer.id,
      token: refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private sanitizeCustomer(customer: any) {
    const { password, ...sanitized } = customer;
    return sanitized;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)([dhm])/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
    };

    return value * multipliers[unit];
  }
}
```

#### Task 1.5: Create Mail Service

**File:** `gaqno-shop-service/src/mail/mail.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

**File:** `gaqno-shop-service/src/mail/mail.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: this.configService.get('SENDGRID_API_KEY'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${this.configService.get('STORE_URL')}/verificar-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"${this.configService.get('EMAIL_FROM_NAME')}" <${this.configService.get('EMAIL_FROM')}>`,
      to,
      subject: 'Verifique seu email - Gaqno Shop',
      html: `
        <h1>Bem-vindo ao Gaqno Shop!</h1>
        <p>Por favor, clique no link abaixo para verificar seu email:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 4px;">Verificar Email</a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p>${verificationUrl}</p>
        <p>Este link expira em 24 horas.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${this.configService.get('STORE_URL')}/redefinir-senha?token=${token}`;

    await this.transporter.sendMail({
      from: `"${this.configService.get('EMAIL_FROM_NAME')}" <${this.configService.get('EMAIL_FROM')}>`,
      to,
      subject: 'Recuperação de senha - Gaqno Shop',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 4px;">Redefinir Senha</a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p>${resetUrl}</p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `,
    });
  }
}
```

#### Task 1.6: Implement JWT Strategy

**File:** `gaqno-shop-service/src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      customerId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    };
  }
}
```

#### Task 1.7: Implement Auth Guard

**File:** `gaqno-shop-service/src/auth/auth.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      request.customer = {
        customerId: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
      };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Task 1.8: Implement Auth Controller

**File:** `gaqno-shop-service/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @CurrentTenant() tenantId: string,
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ) {
    return this.authService.register(tenantId, dto, req.ip, req.headers['user-agent']);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentTenant() tenantId: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(tenantId, dto, req.ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @CurrentTenant() tenantId: string,
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(tenantId, dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }
}
```

#### Task 1.9: Create Auth Module

**File:** `gaqno-shop-service/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

#### Task 1.10: Update App Module

**File:** `gaqno-shop-service/src/app.module.ts`

Add AuthModule to imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CustomerModule } from './customer/customer.module';
import { PaymentModule } from './payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    TenantModule,
    ProductModule,
    CategoryModule,
    CartModule,
    OrderModule,
    CustomerModule,
    PaymentModule,
  ],
})
export class AppModule {}
```

### Frontend Implementation (Phase 1)

#### Task 1.11: Set Up NextAuth Configuration

**File:** `gaqno-shop/src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          return {
            id: data.customer.id,
            email: data.customer.email,
            name: `${data.customer.firstName} ${data.customer.lastName}`,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/cadastro',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
```

**File:** `gaqno-shop/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Create type declarations:** `gaqno-shop/src/types/next-auth.d.ts`

```typescript
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    id: string;
  }
}
```

#### Task 1.12: Create Login Page

**File:** `gaqno-shop/src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Input } from '@gaqno-development/frontcore/components/ui/input';
import { Label } from '@gaqno-development/frontcore/components/ui/label';
import { Alert, AlertDescription } from '@gaqno-development/frontcore/components/ui/alert';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const callbackUrl = searchParams.get('callbackUrl') || '/conta';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: tenant?.primaryColor }}>
            Entrar
          </h1>
          <p className="mt-2 text-gray-600">
            Acesse sua conta na {tenant?.name}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Lembrar de mim
              </label>
            </div>
            <Link
              href="/recuperar-senha"
              className="text-sm font-medium hover:underline"
              style={{ color: tenant?.primaryColor }}
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{ backgroundColor: tenant?.primaryColor }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link
              href="/cadastro"
              className="font-medium hover:underline"
              style={{ color: tenant?.primaryColor }}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### Task 1.13: Create Registration Page

**File:** `gaqno-shop/src/app/cadastro/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@gaqno-development/frontcore/components/ui/button';
import { Input } from '@gaqno-development/frontcore/components/ui/input';
import { Label } from '@gaqno-development/frontcore/components/ui/label';
import { Alert, AlertDescription } from '@gaqno-development/frontcore/components/ui/alert';
import { Loader2, User, Mail, Lock, Phone } from 'lucide-react';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Email inválido';
    }

    if (formData.password.length < 8) {
      errors.password = 'Senha deve ter no mínimo 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas não conferem';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': process.env.NEXT_PUBLIC_TENANT_SLUG || 'default',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          cpf: formData.cpf,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erro ao criar conta. Tente novamente.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Conta criada com sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Enviamos um email de verificação para {formData.email}. Por favor, verifique sua caixa de entrada.
          </p>
          <Link href="/login">
            <Button style={{ backgroundColor: tenant?.primaryColor }}>
              Ir para o login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: tenant?.primaryColor }}>
            Criar Conta
          </h1>
          <p className="mt-2 text-gray-600">
            Junte-se à {tenant?.name}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  placeholder="João"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  placeholder="Silva"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{ backgroundColor: tenant?.primaryColor }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: tenant?.primaryColor }}
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

The plan continues with all remaining phases (2-6). Due to the length, I'll save this to a file and then continue with the remaining sections.
