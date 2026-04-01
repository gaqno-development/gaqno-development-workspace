# Cloudflare Tunnel nos servidores Dokploy

Dois servidores:
- **72.60.251.62** — Dokploy produção (aplicações principais)
- **72.61.221.19** — Dokploy OpenClaw

O **Cloudflare Tunnel** (cloudflared) expõe o Traefik/Dokploy através da rede Cloudflare sem abrir portas 80/443 públicas no servidor da forma tradicional.

---

## Visão geral

1. Criar **dois túneis** no Cloudflare Zero Trust (um por servidor).
2. Instalar **cloudflared** em cada servidor (ou serviço Docker no stack de monitorização).
3. Rodar cloudflared com o **token** do túnel correspondente.
4. Configurar **Public Hostnames** para **`http://dokploy-traefik:80`** — só funciona se o `cloudflared` estiver na **mesma rede Docker** que o Traefik (`dokploy-network`). Ver secção 3.

---

## 1. Criar os túneis no Cloudflare

1. Acesse [Cloudflare Zero Trust](https://one.dash.cloudflare.com).
2. Vá em **Networks** → **Tunnels** → **Create a tunnel**.
3. Tipo: **Cloudflared**.
4. Crie dois túneis (nomes sugeridos):

   | Túnel | Servidor | Uso |
   |-------|----------|-----|
   | `gaqno-dokploy-prod` | 72.60.251.62 | Produção |
   | `gaqno-dokploy-openclaw` | 72.61.221.19 | OpenClaw |

5. Para cada túnel: copie o **token** do connector (_Run a connector_).

---

## 2. Instalar cloudflared em cada servidor

**Debian/Ubuntu**:

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
```

**RHEL/Rocky**:

```bash
curl -fsSl https://pkg.cloudflare.com/cloudflared.repo | sudo tee /etc/yum.repos.d/cloudflared.repo
sudo yum install -y cloudflared
```

---

## 3. Rodar o connector (Docker na `dokploy-network`) — obrigatório para `http://dokploy-traefik:80`

Se nos logs aparecer `lookup dokploy-traefik on …:53: no such host`, o `cloudflared` **não** está na rede Docker do Dokploy — está a resolver o nome na Internet.

### 3.1 Confirmar rede e Traefik no servidor

```bash
docker network ls | grep -i dokploy
docker ps --format '{{.Names}}' | grep -i traefik
```

O nome da rede costuma ser **`dokploy-network`**. Se for outro, usa a variável **`CLOUDFLARED_EDGE_NETWORK`** no compose.

### 3.2 Parar o connector antigo

- Container órfão (ex. `docker run` sem rede): `docker stop <id> && docker rm <id>`
- **systemd:** `sudo systemctl stop cloudflared && sudo systemctl disable cloudflared` (não uses systemd se a origem for `dokploy-traefik`)

### 3.3 Deploy no Dokploy (compose mínimo)

1. No Dokploy, cria um projeto **Docker Compose** (ou adiciona ao stack que já gere o repo).
2. Ficheiro: **`monitoring/docker-compose.cloudflared-tunnel.yml`** na raiz do repositório (ou cola o conteúdo no editor do Dokploy).
3. **Environment:** `CLOUDFLARE_TUNNEL_TOKEN` = token do túnel (Zero Trust → Tunnels → o teu túnel).
4. Opcional: `CLOUDFLARED_EDGE_NETWORK` = nome exato da rede se não for `dokploy-network`.
5. **Deploy.** O serviço `cloudflared` fica **só** na rede externa `dokploy-edge` (mapeada para `dokploy-network`), onde o DNS interno resolve **`dokploy-traefik`**.

### 3.4 Verificação

A imagem `cloudflare/cloudflared` não inclui `wget` nem `curl`. Usa outro container **no mesmo namespace de rede** que o connector (`--network container:NOME`):

```bash
docker ps --format '{{.Names}}' | grep -i cloudflared
docker run --rm --network container:musing_jemison curlimages/curl:8.5.0 \
  curl -sI --max-time 5 http://dokploy-traefik:80
```

Substitui `musing_jemison` pelo **nome real** do container `cloudflared` (coluna NAMES do `docker ps`). Deves ver cabeçalhos HTTP do Traefik (ex. `404` sem `Host`, ou `301`/`302`).

### 3.5 Stack completo de monitoring

O ficheiro **`monitoring/docker-compose.dokploy.yml`** já inclui `cloudflared` em **`default` + `dokploy-edge`**. Podes usar esse stack em vez do mínimo, desde que o deploy no Dokploy injete a rede externa correta.

### 3.6 Systemd no host (apenas se não usares `dokploy-traefik` como URL)

```bash
sudo cloudflared service install <TOKEN>
sudo systemctl enable --now cloudflared
```

Aqui o hostname **`dokploy-traefik` não resolve**. A origem no Zero Trust tem de ser algo que o **host** alcança (ex. `http://127.0.0.1:80` se o Traefik publicar 80 no host).

---

## 4. Public Hostnames (Zero Trust)

Para cada hostname público, o **serviço de origem** deve ser o **Traefik** que o Dokploy usa, por exemplo **`http://dokploy-traefik:80`**, quando o `cloudflared` partilha a rede Docker `dokploy-network`. Mantenha regra final `http_status:404`.

A UI do Dokploy costuma estar em **porta 3000** no host; um hostname dedicado pode apontar para `http://host.docker.internal:3000` (com `extra_hosts` no compose do túnel) se aplicável.

---

## 5. DNS

Os registos para os hostnames do túnel são geridos pelo Zero Trust (CNAME para `.cfargotunnel.com`). Se a zona `gaqno.com.br` estiver no Cloudflare, confirme em **DNS** que os CNAMEs pretendidos existem.

---

## 6. Métricas (opcional)

```bash
cloudflared tunnel --metrics 0.0.0.0:60123 run --token <TOKEN>
```

---

## Resumo

| Servidor | Connector |
|----------|-----------|
| 72.60.251.62 | Compose **`monitoring/docker-compose.cloudflared-tunnel.yml`** + `CLOUDFLARE_TUNNEL_TOKEN` (rede `dokploy-network`) |
| 72.61.221.19 | Igual com o token do túnel desse host |

---

## Referências

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [cloudflared Linux service](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/as-a-service/linux/)
