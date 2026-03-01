# Load balancing nos serviços GAQNO

Este documento descreve como distribuir tráfego entre múltiplas instâncias (réplicas) dos backends para reduzir CPU por processo e aumentar capacidade. O ambiente de referência é **Coolify** com **Traefik**.

---

## Por que usar load balancing

- **Reduzir CPU por instância:** em vez de uma única instância em 100% de CPU, várias instâncias dividem o tráfego (ex.: 2 réplicas → ~50% cada, em média).
- **Maior disponibilidade:** se uma réplica cair, o Traefik deixa de enviar tráfego para ela (com health check).
- **Escala horizontal:** adicionar mais réplicas quando a carga crescer.

---

## Opções no Coolify

### 1. Múltiplos containers no mesmo servidor (réplicas)

Uma mesma aplicação (ex.: `omnichannel-service`) roda em **várias réplicas** no mesmo host. O Traefik já faz round-robin entre os containers quando há mais de um.

**Passos:**

1. No Coolify, abra a aplicação (ex.: Omnichannel Service).
2. Aumente o número de **Replicas** (ex.: 2 ou 3).
3. **Observação:** em algumas versões do Coolify, usar `replicas > 1` com Docker Compose pode falhar se houver `container_name` fixo. Nesse caso, é necessário remover ou comentar `container_name` no `docker-compose` gerado (ex.: via Server/Proxy ou editando o arquivo em `/data/coolify/...`). Ver [discussão #3862](https://github.com/coollabsio/coolify/discussions/3862).
4. Health check: manter configurado (ex.: `GET /v1/health`) para o proxy não enviar tráfego para instâncias doentes.

### 2. Múltiplos servidores (vários hosts)

O mesmo serviço é implantado em **2+ servidores**. O load balancer fica na frente e distribui entre os IPs dos servidores.

**Passos (resumo):**

1. Aplicação deployada em todos os servidores (ver [Multiple Servers](https://coolify.io/docs/knowledge-base/server/multiple-servers)).
2. No Coolify: **Server settings → Proxy** (tab).
3. Adicionar configuração dinâmica do Traefik em `/data/coolify/proxy/dynamic` (ou pela UI, se disponível) com:
   - `routers` para o domínio (ex.: `Host(\`api.gaqno.com.br\`)`).
   - `services` com `loadBalancer.servers` listando as URLs dos servidores (ex.: `http://IP1:PORT`, `http://IP2:PORT`).

Exemplo (HTTPS) para 2 servidores:

```yaml
http:
  services:
    lb-https:
      loadBalancer:
        servers:
          - url: 'http://<IP_SERVIDOR_1>:4008'
          - url: 'http://<IP_SERVIDOR_2>:4008'
  routers:
    lb-https:
      rule: Host(`omnichannel.gaqno.com.br`)
      service: lb-https
      entryPoints: [https]
      tls:
        certResolver: letsencrypt
```

Substituir `<IP_SERVIDOR_1>`, `<IP_SERVIDOR_2>` e a porta conforme o serviço.

---

## Sticky session (Omnichannel / WebSocket)

O **omnichannel-service** usa **Socket.IO** (WebSocket + polling). Para o mesmo cliente manter a conexão com a **mesma réplica**, é necessário **sticky session** no Traefik (affinity por cookie).

### Traefik: middleware de sticky cookie

Na configuração dinâmica do Traefik (Server → Proxy ou arquivo em `dynamic/`), adicione um middleware de sticky e use-o no router do omnichannel:

```yaml
http:
  middlewares:
    omnichannel-sticky:
      stickyCookie:
        name: omnichannel_affinity
        secure: true
        httpOnly: true
        sameSite: lax
  routers:
    omnichannel-https:
      rule: Host(`omnichannel.gaqno.com.br`)
      service: omnichannel-service
      middlewares:
        - omnichannel-sticky
      entryPoints: [https]
      tls:
        certResolver: letsencrypt
  services:
    omnichannel-service:
      loadBalancer:
        servers:
          - url: 'http://<CONTAINER_OU_IP_1>:4008'
          - url: 'http://<CONTAINER_OU_IP_2>:4008'
```

Assim, após a primeira resposta, o Traefik envia um cookie; nas próximas requisições (incluindo upgrade para WebSocket) o mesmo cliente é direcionado à mesma réplica.

### Serviços que não precisam de sticky

APIs REST stateless (SSO, CRM, PDV, ERP, Finance, etc.) **não** precisam de sticky. Pode usar só `loadBalancer.servers` com várias URLs, sem middleware de cookie.

---

## Resumo por serviço

| Serviço               | Réplicas recomendadas | Sticky session |
|-----------------------|------------------------|----------------|
| omnichannel-service   | 2+                     | Sim (WebSocket) |
| ai-service            | 2+                     | Opcional       |
| sso-service           | 2+                     | Não            |
| crm-service           | 2+                     | Não            |
| pdv-service           | 2 se carga alta        | Não            |
| Demais backends       | 2 se CPU alta          | Não            |

---

## Referências

- [Coolify – Load balancing (Traefik)](https://coolify.io/docs/knowledge-base/proxy/traefik/load-balancing)
- [Coolify – Multiple servers](https://coolify.io/docs/knowledge-base/server/multiple-servers)
- [Traefik – Sticky Cookie](https://doc.traefik.io/traefik/routing/services/#sticky-cookie)
- Diagnóstico de CPU e uso de réplicas: [CPU_OPTIMIZATION_INVESTIGATION.md](CPU_OPTIMIZATION_INVESTIGATION.md)
