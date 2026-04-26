# Google OAuth via SSO - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar login Google OAuth federado via SSO service - usuário faz login via Google no SSO, recebe token SSO, shop usa esse token.

**Architecture:** 
- SSO expõe endpoints `/auth/google/start` (redireciona → Google) e `/auth/google/callback` (recebe code, valida, retorna SessionContext)
- Google OAuth usa OAuth2 flow padrão com `googleapis`
- Shop usa nova URL callback que aponta para SSO (não mais para Google diretamente)
- Sessão controlada pelo SSO, tokens emitidos pelo SSO

**Tech Stack:** NestJS, googleapis, @gaqno-development/types

---

## Phase 1: SSO Service - Google OAuth

### Task 1.1: Criar Google OAuth Service no SSO

**Arquivo:** `gaqno-sso-service/src/auth/google-oauth.service.ts`

Criar serviço que gerencia OAuth2 com Google:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';

export interface GoogleUserInfo {
  readonly id: string;
  readonly email: string;
  readonly verifiedEmail: boolean;
  readonly name?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly picture?: string;
}

export interface GoogleOAuthResult {
  readonly user: GoogleUserInfo;
  readonly accessToken: string;
  readonly refreshToken?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly oauth2Client: OAuth2Client;

  constructor(private config: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_OAUTH_CALLBACK_URL'), // https://sso.gaqno.com.br/auth/google/callback
    );
  }

  getAuthUrl(state: string): string {
    const scopes = ['openid', 'email', 'profile'];
    return this.oauth2Client.generateAuthUrl({
      accessType: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  async exchangeCode(code: string): Promise<GoogleOAuthResult> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    return {
      user: {
        id: userInfo.data.id!,
        email: userInfo.data.email!,
        verifiedEmail: userInfo.data.emailVerified ?? false,
        name: userInfo.data.name,
        givenName: userInfo.data.givenName,
        familyName: userInfo.data.familyName,
        picture: userInfo.data.picture,
      },
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
    };
  }
}
```

### Task 1.2: Criar DTOs para Google OAuth

**Arquivo:** `gaqno-sso-service/src/auth/dto/google-oauth.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleOAuthStartDto {
  @IsString()
  @IsNotEmpty()
  readonly state!: string;
}

export class GoogleOAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  readonly code!: string;

  @IsString()
  readonly state?: string;

  @IsString()
  readonly error?: string;

  @IsString()
  readonly errorDescription?: string;
}
```

### Task 1.3: Adicionar endpoints no AuthController

**Arquivo:** `gaqno-sso-service/src/auth/auth.controller.ts`

Adicionar depois do endpoint `refresh`:

```typescript
@Get('auth/google/start')
async googleOAuthStart(
  @Res() res: Response,
  @Query('redirect_to') redirectTo?: string,
): Promise<void> {
  const state = uuidv4();
  // Armazenar state + redirectTo em cache/DB para validar no callback
  const url = this.googleOAuthService.getAuthUrl(state);
  return res.redirect(url);
}

@Get('auth/google/callback')
async googleOAuthCallback(
  @Query('code') code: string,
  @Query('state') state: string,
  @Res() res: Response,
): Promise<void> {
  try {
    const result = await this.googleOAuthService.exchangeCode(code);
    // Buscar ou criar usuário, issue tokens
    const session = await this.authService.signInWithGoogle(result.user, result.accessToken, res);
    // Redirecionar para shop com tokens na URL ou cookies
    const redirectUrl = process.env.GOOGLE_OAUTH_SUCCESS_URL + '?token=' + session.tokens.accessToken;
    return res.redirect(redirectUrl);
  } catch (error) {
    const errorUrl = process.env.GOOGLE_OAUTH_SUCCESS_URL + '?error=oauth_failed';
    return res.redirect(errorUrl);
  }
}
```

### Task 1.4: Adicionar método signInWithGoogle no AuthService

**Arquivo:** `gaqno-sso-service/src/auth/auth.service.ts`

Adicionar método (depois de signIn):

```typescript
async signInWithGoogle(
  googleUser: GoogleUserInfo,
  googleAccessToken: string,
  res: Response,
): Promise<SessionContext> {
  // 1. Buscar usuário por email ou googleId
  // 2. Se não existir, criar novo usuário (pending status, sem senha)
  // 3. Se existir, vincular conta Google se não estiver vinculada
  // 4. Generate tokens
  // 5. Set cookies
  // 6. Return SessionContext
}
```

### Task 1.5: Adicionar schema para OAuth accounts

**Arquivo:** `gaqno-sso-service/src/database/schema/users.sql` (verificar estrutura existente)

Criar tabela ou adicionar colunas:
- `users.googleId` (string, nullable)
- `users.googleAccessToken` (string, nullable)
- `users.googleRefreshToken` (string, nullable)

### Task 1.6: Registrar GoogleOAuthService no AuthModule

**Arquivo:** `gaqno-sso-service/src/auth/auth.module.ts`

```typescript
import { GoogleOAuthService } from './google-oauth.service';

providers: [AuthService, OtpService, SessionGuard, HostTenantLookupService, GoogleOAuthService],
exports: [AuthService, SessionGuard, OtpService, GoogleOAuthService],
```

### Task 1.7: Variáveis de ambiente

**Arquivo:** `gaqno-sso-service/.env.example`

```
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_OAUTH_CALLBACK_URL=https://sso.gaqno.com.br/auth/google/callback
GOOGLE_OAUTH_SUCCESS_URL=https://shop.gaqno.com.br/oauth/callback
```

### Task 1.8: Testes Unitários

**Arquivo:** `gaqno-sso-service/src/auth/google-oauth.service.spec.ts`

Testar:
- `getAuthUrl` gera URL correta
- `exchangeCode` retorna user info
- erros tratados corretamente

---

## Phase 2: Shop - Integration with SSO OAuth

### Task 2.1: Modificar auth.ts para usar SSO como provider

**Arquivo:** `gaqno-shop/src/lib/auth.ts`

 Opção A (Callback URL pointing to SSO):
- Manter GoogleProvider mas mudar `authorization.url` para endpoint SSO
- Ou criar custom provider

 Opção B (Recommended - Custom callback):
```typescript
// Novo provider que faz redirect para SSO
const GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      redirect_uri: `${process.env.NEXT_PUBLIC_SSO_URL}/auth/google/callback`,
      // state gerado pelo NextAuth
    },
  },
})
```

Na verdade, melhor remover GoogleProvider completamente e criar:

```typescript
// Custom provider para SSO redirect
const SSOProvider({
  id: 'sso',
  name: 'SSO',
  type: 'oauth',
  authorization: {
    url: `${process.env.SSO_URL}/auth/google/start`,
    params: {
      redirect_to: process.env.NEXT_PUBLIC_SHOP_URL + '/api/auth/callback/sso',
    },
  },
  token: `${process.env.SSO_URL}/auth/google/token`,
  userinfo: { url: `${process.env.SSO_URL}/me` },
  profile: (profile) => profile,
})
```

### Task 2.2: Criar rota de callback no shop

**Arquivo:** `gaqno-shop/src/app/api/auth/callback/sso/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
  
  // Validar token com SSO e criar sessão NextAuth
  // Retornar redirect para dashboard
}
```

---

## Test Checklist

- [ ] SSO: `GET /auth/google/start` redireciona para Google
- [ ] SSO: Callback cria/orAtualiza usuário
- [ ] SSO: Retorna tokens correta para shop
- [ ] Shop: Login direciona para SSO
- [ ] Shop: Callback funciona corretamente
- [ ] Integração: Usuário faz login via Google una vez, pode acessar shop

---

## Referência

- Artigo referência: https://medium.com/t-slen/google-auth-using-nestjs-2643af563f8e
- Documentação Google OAuth: https://developers.google.com/identity/protocols/oauth2
- NextAuth callbacks: https://next-auth.js.org/configuration/callbacks

---

## Alternativas Consideradas

| Abordagem | Prós | Contras |
|-----------|-----|---------|
| A) SSO redirect | Controle total, uma única credencial Google | Mais redirects |
| B) Shop valida, SSO emite | Mais rápido | Duplicação de lógica OAuth |

Recomendado: Abordagem A por ser mais simples e centralizada.