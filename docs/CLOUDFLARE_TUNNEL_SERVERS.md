# Cloudflare Tunnel nos servidores Coolify

Dois servidores:
- **72.60.251.62** — Coolify produção (todas as aplicações)
- **72.61.221.19** — Coolify OpenClaw

O **Cloudflare Tunnel** (cloudflared) expõe o Coolify através da rede Cloudflare sem abrir portas 80/443 no servidor.

---

## Visão geral

1. Criar **dois túneis** no Cloudflare Zero Trust (um por servidor).
2. Instalar **cloudflared** em cada servidor.
3. Rodar cloudflared com o **token** do túnel correspondente.
4. Configurar **Public Hostnames** no dashboard (ex.: `coolify.gaqno.com.br` → prod, `coolify-openclaw.gaqno.com.br` → OpenClaw).

---

## 1. Criar os túneis no Cloudflare

1. Acesse [Cloudflare Zero Trust](https://one.dash.cloudflare.com) (ou Dashboard → Zero Trust).
2. Vá em **Networks** → **Tunnels** → **Create a tunnel**.
3. Tipo: **Cloudflared**.
4. Crie dois túneis:

   | Túnel           | Servidor         | Uso      |
   |-----------------|------------------|----------|
   | `gaqno-coolify-prod` | 72.60.251.62 | Produção |
   | `gaqno-coolify-openclaw` | 72.61.221.19 | OpenClaw |

5. Para cada túnel:
   - Copie o **Installation command** ou o **token** (formato `eyJ...`).
   - Ou vá em **Configure** e anote o **Tunnel token** em _Configure Connector_.

---

## 2. Instalar cloudflared em cada servidor

**Debian/Ubuntu** (em ambos os servidores):

```bash
# Adicionar repositório Cloudflare
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Instalar
sudo apt-get update && sudo apt-get install -y cloudflared
```

**RHEL/Rocky**:

```bash
curl -fsSl https://pkg.cloudflare.com/cloudflared.repo | sudo tee /etc/yum.repos.d/cloudflared.repo
sudo yum install -y cloudflared
```

---

## 3. Configurar e rodar o túnel

### Opção A: Token (recomendado)

Use o token gerado no passo 1.

**No 72.60.251.62 (produção):**

```bash
# Rodar com o token do túnel gaqno-coolify-prod
sudo cloudflared tunnel --no-autoupdate run --token <TOKEN_PROD>
```

**No 72.61.221.19 (OpenClaw):**

```bash
# Rodar com o token do túnel gaqno-coolify-openclaw
sudo cloudflared tunnel --no-autoupdate run --token <TOKEN_OPENCLAW>
```

### Opção B: Arquivo de credenciais (alternativa)

Se preferir usar credenciais em arquivo:

```bash
# Em cada servidor, após cloudflared tunnel login
cloudflared tunnel create gaqno-coolify-prod   # no 72.60.251.62
cloudflared tunnel create gaqno-coolify-openclaw  # no 72.61.221.19
```

Depois crie `~/.cloudflared/config.yml` em cada servidor, por exemplo (produção):

```yaml
tunnel: <UUID-DO-TUNEL>
credentials-file: /root/.cloudflared/<UUID>.json

ingress:
  - hostname: coolify.gaqno.com.br
    service: http://localhost:8000
  - service: http_status:404
```

---

## 4. Instalar como serviço systemd

Para o túnel subir automaticamente e sobreviver a reinícios:

**No 72.60.251.62 (produção):**

```bash
sudo cloudflared service install <TOKEN_PROD>
# ou, se já tiver config em ~/.cloudflared/config.yml:
# sudo cloudflared --config /root/.cloudflared/config.yml service install

sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

**No 72.61.221.19 (OpenClaw):** mesmo processo com `<TOKEN_OPENCLAW>`.

Se usar token, o comando `cloudflared service install <TOKEN>` cria o service e salva o token.

---

## 5. Public Hostnames no Zero Trust

No dashboard **Zero Trust** → **Networks** → **Tunnels** → selecione cada túnel → **Public Hostname**:

**Túnel gaqno-coolify-prod (72.60.251.62):**
- Hostname: `coolify.gaqno.com.br` (ou o subdomínio desejado)
- Service type: **HTTP**
- URL: `localhost:8000` (porta padrão do Coolify)

**Túnel gaqno-coolify-openclaw (72.61.221.19):**
- Hostname: `coolify-openclaw.gaqno.com.br` (ou `lenin.gaqno.com.br` se preferir)
- Service type: **HTTP**
- URL: `localhost:8000`

---

## 6. DNS

Os hostnames (`coolify.gaqno.com.br`, `coolify-openclaw.gaqno.com.br`) são criados automaticamente quando você adiciona o Public Hostname ao túnel — Cloudflare usa um CNAME interno (`.cfargotunnel.com`). Não é necessário criar registros DNS manualmente na zona gaqno.com.br; o Zero Trust faz isso.

Se a zona gaqno.com.br já estiver no Cloudflare, verifique que o CNAME foi criado em **Websites** → **gaqno.com.br** → **DNS**.

---

## 7. Métricas (opcional)

Para expor métricas do cloudflared (ex.: para Prometheus/Grafana):

```bash
cloudflared tunnel --metrics 0.0.0.0:60123 run --token <TOKEN>
```

Ou no `config.yml`:

```yaml
metrics: 0.0.0.0:60123
```

---

## Resumo de comandos (por servidor)

| Servidor | Túnel | Comando (teste) |
|----------|-------|----------------|
| 72.60.251.62 | gaqno-coolify-prod | `sudo cloudflared tunnel run --token <TOKEN_PROD>` |
| 72.61.221.19 | gaqno-coolify-openclaw | `sudo cloudflared tunnel run --token <TOKEN_OPENCLAW>` |

---

## Referências

- [Cloudflare Tunnel - Create locally](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/create-local-tunnel)
- [Cloudflared downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/cloudflared-install/)
- [Run as a service (Linux)](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/as-a-service/linux/)
