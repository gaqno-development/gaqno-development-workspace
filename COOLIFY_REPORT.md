# Relatório do Coolify MCP

## Teste realizado em: 2026-02-20 20:08 UTC

### ✅ Status do Teste
- **Conexão API**: ✅ Bem-sucedida
- **Token**: ✅ Válido
- **MCP Coolify**: ✅ Configurado e funcionando

### 📊 Resumo da Infraestrutura

#### 1. 🖥️ Servidores (1)
- **localhost** (`host.docker.internal`)
  - UUID: `zkgswkkwsgk4w404w0ck0ws8`
  - Status: Acessível
  - É o servidor onde o Coolify está rodando

#### 2. 📁 Projetos (2)
1. **gaqno development** (ID: 1)
2. **Cloudflare** (ID: 3)

#### 3. 📦 Aplicações (25 no total)

**Distribuição por status:**
- ✅ `running:healthy`: 17 aplicações
- ⚠️ `running:unknown`: 6 aplicações  
- ❌ `running:unhealthy`: 2 aplicações

**Aplicações principais:**
- ✅ `gaqno-sso-service`: running:healthy (http://api.gaqno.com.br/sso)
- ✅ `gaqno-ai-service`: running:healthy (http://api.gaqno.com.br/ai)
- ⚠️ `gaqno-shell-ui`: running:unknown
- ✅ `kafka-ui`: running:healthy (http://vwk408cksw48g8wwoc44ooog.gaqno.com.br)

**Lista completa de aplicações:**
1. gaqno-admin-service (running:unknown)
2. gaqno-admin-ui (running:healthy)
3. gaqno-ai-service (running:healthy)
4. gaqno-ai-ui (running:healthy)
5. gaqno-crm-ui (running:healthy)
6. gaqno-erp-ui (running:healthy)
7. gaqno-finance-service (running:unknown)
8. gaqno-finance-ui (running:healthy)
9. gaqno-landing-ui (running:unknown)
10. gaqno-lead-enrichment-service (running:healthy)
11. gaqno-lenin-ui (running:unknown)
12. gaqno-omnichannel-service (running:healthy)
13. gaqno-omnichannel-ui (running:healthy)
14. gaqno-pdv-service (running:unhealthy)
15. gaqno-pdv-ui (running:healthy)
16. gaqno-rpg-service (running:unhealthy)
17. gaqno-rpg-ui (running:healthy)
18. gaqno-saas-service (running:unknown)
19. gaqno-saas-ui (running:healthy)
20. gaqno-shell-ui (running:unknown)
21. gaqno-sso-service (running:healthy)
22. gaqno-sso-ui (running:healthy)
23. gaqno-wellness-service (running:healthy)
24. gaqno-wellness-ui (running:healthy)
25. kafka-ui (running:healthy)

#### 4. 🔧 Serviços (5)
1. ✅ `gaqno-pgadmin`: running:healthy
2. ✅ `kafka`: running:healthy
3. ⚠️ `gaqno-grafana`: running:unknown
4. ✅ `openclaw`: running:healthy
5. ✅ `cloudflared-mkkgcs408swg4wcs404wsswc`: running:healthy

#### 5. 🗄️ Bancos de Dados (2)
1. ✅ `redis-gaqno`: running:healthy (Redis for omnichannel and cache...)
2. ✅ `redis-gaqno-dev`: running:healthy

### 🔍 Análise do MCP Jira

**Status**: ❌ Não testável

**Problema identificado**: O token do Jira está expirado ou inválido.

**Solução necessária**:
1. Gerar novo token em: https://id.atlassian.com/manage-profile/security/api-tokens
2. Atualizar o arquivo `.env.jira` com o novo token
3. Atualizar o arquivo `.cursor/mcp.json` com as novas credenciais

### 🎯 Conclusão

✅ **MCP Coolify**: Testado com sucesso - todas as 25 aplicações da plataforma Gaqno estão gerenciadas pelo Coolify.

❌ **MCP Jira**: Não foi possível testar devido a token expirado.

### 📝 Próximos Passos

1. **Renovar token do Jira** para testar a integração completa
2. **Testar outros MCPs** (Playwright, Shadcn, Postgres, Cloudflare)
3. **Implementar automações** usando os MCPs configurados
4. **Monitorar aplicações** com status "unknown" ou "unhealthy"

---
*Relatório gerado automaticamente pelo teste do MCP Bridge*