# Investigação de CPU (100%) e Otimizações

## Resumo

Os serviços estavam batendo **100% de CPU** de forma sustentada. Esta investigação identifica causas prováveis e aplica ou recomenda correções.

---

## Causas identificadas

### 1. **Outbox processor – ticks sobrepostos (corrigido)**

**Problema:** Tanto o `gaqno-omnichannel-service` quanto o `gaqno-ai-service` usam um outbox processor que publica mensagens do banco para o Kafka. O ciclo era:

```ts
setInterval(() => this.tick(), POLL_MS);  // a cada 2s, dispara tick()
```

Como `tick()` é assíncrono (DB + Kafka), o `setInterval` **não espera** o término do `tick()` anterior. Se um `tick()` demorar mais que 2s (Kafka lento, muitas linhas, etc.):

- Vários `tick()` rodam em paralelo
- Múltiplas queries ao banco e múltiplas publicações Kafka ao mesmo tempo
- Uso de CPU e carga no DB/Kafka disparam

**Correção aplicada:** Troca de `setInterval` por **“agendar próximo só depois do tick terminar”**:

- `scheduleTick()` agenda um `setTimeout` de 2s que chama `tick()` e, no `finally`, chama de novo `scheduleTick()`.
- Assim, **nunca há dois `tick()` rodando ao mesmo tempo**.
- Arquivos alterados:
  - `gaqno-omnichannel-service/src/kafka/outbox-processor.service.ts`
  - `gaqno-ai-service/src/event-store/outbox-processor.service.ts`

---

### 2. **Token polling no Omnichannel UI (recomendado)**

**Problema:** No frontend, o hook `useOmnichannelSocket.ts` renova o token a cada **2s** (`TOKEN_POLL_MS = 2000`). Isso gera:

- Reconexões/atualizações de socket frequentes
- Mais requisições ao backend e mais trabalho no gateway WebSocket
- Documento `OMNICHANNEL_STABILITY_ANALYSIS.md` já recomenda 10s

**Recomendação:** Aumentar para **10s** (ou configurável por env) no `gaqno-omnichannel-ui`:

```ts
const TOKEN_POLL_MS = 10000; // era 2000
```

Ou usar o hook otimizado `useOmnichannelSocketOptimized` onde já existir.

---

### 3. **WebSocket / conexões e CORS**

**Problema:** Conforme `OMNICHANNEL_STABILITY_ANALYSIS.md`:

- Muitas conexões/desconexões de WebSocket em pouco tempo
- Rajadas de requisições OPTIONS (CORS)
- Risco de esgotar pool de conexões e acumular handlers

**Já existente:** Rate limit no gateway (por IP), cleanup de mapa de rate limit a cada 5 min (com `.unref()`).

**Recomendações:**

- Garantir que o frontend use **um único socket por aba/tenant** e evite reconnects desnecessários (ex.: token a 10s).
- Cache de preflight CORS (`maxAge` alto para OPTIONS) no backend para reduzir carga de OPTIONS.

---

### 4. **Métricas (SSO e outros)**

**Problema:** No `gaqno-sso-service`, `MetricsService`:

- Chama `collectDefaultMetrics()` (métricas padrão do Node)
- Agenda `recordPoolStats()` a cada **5s**

Em ambientes com muitos processos ou métricas pesadas, isso pode somar no uso de CPU.

**Recomendações:**

- Aumentar o intervalo de `recordPoolStats()` para 15–30s se a granularidade for aceitável.
- Considerar desativar métricas padrão menos úteis em produção (ex.: via opções do `collectDefaultMetrics`).

---

### 5. **Outros intervalos no monorepo**

| Onde                    | Intervalo | Observação                          |
|-------------------------|-----------|-------------------------------------|
| Outbox (omni + ai)      | 2s        | Corrigido (sem sobreposição)        |
| SSO pool stats          | 5s        | Possível aumentar para 15–30s       |
| Omnichannel UI token    | 2s        | Recomendado 10s                      |
| RPG UI initiative poll  | 1s        | Só frontend; revisar se necessário  |
| SaaS RealTimeMonitor    | 10s/30s/60s | Frontend; intervalos já altos      |

Nenhum outro loop síncrono contínuo foi encontrado nos backends que justifique 100% de CPU sozinho.

---

## O que foi feito neste PR/commit

1. **Outbox processor (omni + ai):** troca de `setInterval` por “next tick após o anterior terminar”, evitando ticks sobrepostos e picos de CPU/DB/Kafka.
2. **Testes:** ajuste dos specs para `timeoutId` e `scheduleTick()` em vez de `intervalId` e `setInterval`.
3. **Documento:** este arquivo com diagnóstico e recomendações.

---

## Próximos passos recomendados

1. **Frontend Omnichannel:** aumentar `TOKEN_POLL_MS` para 10s (ou usar hook otimizado em todas as telas).
2. **Métricas SSO:** aumentar intervalo de coleta de pool stats (ex.: 15s) e revisar `collectDefaultMetrics`.
3. **Monitoramento:** usar métricas de evento de loop (event loop lag) e CPU por processo (ex.: Prometheus/Node) para validar a queda de 100% após as mudanças do outbox e do token.
4. **Recursos:** se vários serviços rodam no mesmo host, considerar limites de CPU (cgroups/Kubernetes) e mais réplicas com menos CPU cada, em vez de um processo único com 100%.
5. **Load balancing:** usar múltiplas réplicas dos backends atrás de um load balancer para distribuir tráfego e reduzir CPU por instância (ver seção abaixo).

---

## Load balancing e múltiplas réplicas

Distribuir o tráfego entre várias instâncias do mesmo serviço reduz a carga por processo e evita que uma única instância fique em 100% de CPU.

### Quando usar

- **Backends stateless (APIs REST):** SSO, CRM, PDV, ERP, Finance, etc. — escalar horizontalmente com réplicas atrás de um load balancer.
- **Omnichannel / AI (com WebSocket ou outbox):** também podem ter réplicas; para WebSocket é necessário **sticky session** (mesmo cliente sempre na mesma instância) para o Socket.IO não quebrar.

### No Coolify

1. **Réplicas:** na aplicação do serviço, aumentar o número de **replicas** (ex.: 2 ou 3 para omnichannel-service e ai-service).
2. **Proxy/Load Balancer:** o Coolify expõe o tráfego via proxy reverso. Garantir que o proxy está na frente de todas as réplicas (geralmente já é o caso quando se define “replicas > 1”).
3. **Sticky session (Omnichannel):** o Socket.IO precisa que o mesmo cliente caia sempre na mesma instância. No Coolify/Traefik isso costuma ser por cookie (ex.: `stickiness` / affinity por cookie). Se o proxy do Coolify suportar, ativar **sticky session** para o domínio/rota do omnichannel (ex.: `/omnichannel/` e path do socket.io). Sem sticky, cada request pode ir para uma réplica diferente e o WebSocket pode falhar ao reconectar.
4. **Health check:** manter health check configurado (ex.: `/v1/health`) para o load balancer tirar instâncias do roteamento quando estiverem doentes.

### Resumo prático

| Serviço              | Réplicas recomendadas | Sticky session |
|----------------------|------------------------|----------------|
| omnichannel-service  | 2+                     | Sim (WebSocket) |
| ai-service           | 2+                     | Opcional       |
| sso-service          | 2+                     | Não            |
| crm-service          | 2+                     | Não            |
| Demais backends      | 2 se CPU alta          | Não            |

Detalhes de configuração no Coolify: ver [LOAD_BALANCING.md](LOAD_BALANCING.md).

---

## Como validar

- **Antes:** CPU do processo do omnichannel/ai em ~100% de forma sustentada sob carga de mensagens/outbox.
- **Depois:** CPU deve estabilizar bem abaixo de 100% e sem picos longos; atraso do outbox continua limitado a ~2s entre ciclos (sem paralelismo).

Se ainda houver 100% após o deploy, priorizar: (1) token poll 10s no UI, (2) métricas SSO, (3) análise de perfil (ex.: `node --prof` ou flamegraph) no processo que ainda estiver no limite.
