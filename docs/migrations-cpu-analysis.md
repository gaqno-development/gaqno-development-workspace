# Análise: Migrations e CPU em 100%

## Conclusão

As migrations **não** rodam em loop nem fazem polling. Elas executam **uma vez** no startup (`onModuleInit` do `DatabaseService`). O cenário mais provável para CPU em 100% **sustentado** é:

1. **Restart loop**: o healthcheck mata o container antes do app terminar de subir (migrations + `listen()`). O orchestrator reinicia o container → migrations rodam de novo → timeout/healthcheck falha de novo → repete. Vários processos subindo ao mesmo tempo ou várias instâncias tentando migrar ao mesmo tempo aumentam carga de CPU (e no PostgreSQL).
2. **Migrations lentas**: o arquivo de migration tem dezenas/centenas de statements (CREATE TYPE, CREATE TABLE, CREATE INDEX, etc.). Em DB sob carga ou com lock contention, a transação de migration pode demorar. Enquanto isso o app não chama `listen()` e o healthcheck falha → restart.
3. **PostgreSQL em 100%**: se o “servidor” for o do banco, a própria execução da migration (muitos DDLs, índices) pode deixar o DB em alta CPU; com múltiplas réplicas do app tentando migrar, piora.

## O que foi verificado

### Fluxo de migrations

- **Drizzle**: `migrate()` lê uma vez `meta/_journal.json` e os `.sql`, executa em uma transação só as migrations “novas” (comparando `created_at` na tabela `__drizzle_migrations` / `drizzle_migrations` com `folderMillis` do journal). Não há polling nem reexecução em loop.
- **Nest**: migrations rodam no `onModuleInit()` do `DatabaseService`, antes de qualquer rota. Só depois que todos os módulos inicializam é que `app.listen()` é chamado. Até migrations acabarem, o app **não responde** ao healthcheck.
- **Serviços**: padrão igual em gaqno-crm-service, gaqno-erp-service, gaqno-finance-service, gaqno-wellness-service, gaqno-omnichannel-service, etc.: pool → (opcional) seed de legacy migrations → `migrate(db, { migrationsFolder })`.

### Outros timers no omnichannel

- **OutboxProcessorService**: `setTimeout` recursivo a cada 2s (poll da outbox) — intervalo alto, não explica 100% CPU sozinho.
- **WebSocket gateway**: `setInterval` de 5 minutos para limpar rate limit — irrelevante para CPU.
- **db.service (omnichannel)**: timeout de 45s na migration e de 5s no `migrationPool.end()` — não há loop.

### Migration SQL (ex.: omnichannel `0000_true_tombstone.sql`)

- CREATE TYPE e CREATE TABLE com `IF NOT EXISTS` / blocos `DO $$ ... IF NOT EXISTS ... END $$` — idempotentes, não causam loop.
- Muitos statements em um único run podem deixar a transação lenta e o startup longo, contribuindo para healthcheck falhar e restart loop.

## Recomendações

### 1. Rodar migrations fora do startup (recomendado)

- Executar migrations em um **job/step de deploy** (Dokploy pre-deploy, init container, ou script no CI) e **não** no `onModuleInit` do app.
- O app só sobe com o schema já atualizado, reduzindo tempo até `listen()` e evitando que várias réplicas disputem a mesma migration no PostgreSQL.

### 2. Aumentar o start period do healthcheck

- Se continuar rodando migrations no startup, configurar no Dokploy/Docker/K8s um **health check start period** (e.g. 90–120s) maior que:
  - tempo típico das migrations (ex.: 45s de timeout no omnichannel), e
  - tempo de subida do Nest até `listen()`.
- Assim o orchestrator não mata o container enquanto as migrations ainda estão rodando.

### 3. Garantir que apenas uma instância rode migrations

- Se migrations continuarem no app, usar um **lock** (advisory lock no PostgreSQL ou lock distribuído) no início de `runMigrations`: quem pegar o lock executa; as outras instâncias esperam ou pulam. Evita múltiplas transações pesadas ao mesmo tempo e reduz pico de CPU no DB.

### 4. Opção de pular migrations no app

- Variável de ambiente, e.g. `SKIP_MIGRATIONS=true`, para quando as migrations forem executadas em job de deploy. No `DatabaseService.onModuleInit`, se `SKIP_MIGRATIONS` estiver setada, não chamar `runMigrations()`. Útil para manter um único fluxo de migration (no deploy) e startup mais rápido no app.

### 5. Confirmar onde está a CPU em 100%

- Se for no **host do app**: focar em restart loop e em reduzir trabalho no startup (migrations fora do app ou com lock).
- Se for no **PostgreSQL**: focar em rodar migrations uma vez (deploy/init), em lock para uma única instância e, se necessário, em quebrar migrations muito grandes em etapas (ex.: índices em passos separados com `CONCURRENTLY` onde fizer sentido).

## Resumo

- Migrations **não** ficam em loop; rodam uma vez no startup.
- CPU em 100% tende a ser efeito de **restart loop** (healthcheck matando o container antes de `listen()`) e/ou de **migrations pesadas** no PostgreSQL.
- Mitigar: rodar migrations no deploy (fora do app), aumentar start period do healthcheck e/ou garantir que só uma instância execute migrations (lock). Opcional: `SKIP_MIGRATIONS` e mover migrations pesadas para passos separados.
