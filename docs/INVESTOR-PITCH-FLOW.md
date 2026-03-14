# Apresentação para Investidor — Gaqno

Documento de apoio: **o que mostrar** e **como melhorar o fluxo** da demo.

---

## 1. Pontos fortes para mostrar

### 1.1 Portfólio de produtos (suite integrada)

| Produto        | Valor para o investidor |
|----------------|--------------------------|
| **CRM**        | Pipeline de vendas, leads, clientes, inventário, operações, financeiro, relatórios, automação, **AI Marketing** (vídeo), administração. Diferencial: CRM completo + IA. |
| **ERP**        | Catálogo, pedidos, estoque, conteúdo com IA. Operações B2B/B2C integradas. |
| **PDV**        | Ponto de venda para loja; vendas e estoque no dia a dia. |
| **Finance**   | Controle financeiro, categorias, fluxo de caixa, relatórios. |
| **Omnichannel**| WhatsApp e canais unificados, filas, atendimento com IA — forte para SMB. |
| **IA (AI)**    | Chat, geração de conteúdo (áudio, imagem, vídeo), studio, descoberta, retail. Produto de IA transversal. |
| **RPG**        | Narrativa/jogos com IA — produto de experiência e engajamento. |
| **Wellness**   | Hoje, timeline, stats, insights — produto de hábitos/wellness. |
| **SaaS (admin)**| Gestão de tenants, domínios, filiais, custos, codemap — plataforma multi-tenant. |

Mensagem: **uma única plataforma** (Shell + Module Federation) que entrega CRM, ERP, PDV, Finance, Omnichannel, IA e SaaS, com **multi-tenant** e **white-label** (domínios/tenants).

### 1.2 Diferenciais técnicos e de produto

- **Module Federation (MFE)**: Shell único, apps (CRM, ERP, PDV, etc.) carregados sob demanda; escalabilidade e deploys independentes.
- **Multi-tenant + SSO**: gaqno-sso-service; tenants, domínios, filiais no admin/saas.
- **IA integrada**: AI Marketing no CRM (vídeo), AI Content no ERP, módulo IA dedicado (books, audio, images, video, studio, discovery, retail).
- **Lead enrichment**: Serviço assíncrono (BullMQ + Pipedrive) para enriquecimento de leads — integração B2B.
- **Observabilidade**: Prometheus + Grafana (Front, Backend, DevOps, DNS droppage, bundle size, DORA/CI-CD); Coolify para deploy.
- **Design system**: frontcore (UI unificada, i18n, auth, tenant); regras de design (dark-first, hierarquia, SMB).

### 1.3 Prova de execução

- Monorepo com **dezenas de workspaces** (UIs + services + packages).
- **Dockerfiles** por app/serviço; regra de build antes de push.
- **Coolify** para deploy; **Grafana** em grafana.gaqno.com.br; **Cloudflare Tunnel**.
- Pacotes compartilhados: `@gaqno-frontcore`, `@gaqno-backcore`, `@gaqno-types`, `@gaqno-agent`.

---

## 2. Fluxo sugerido da apresentação (ordem lógica)

### Fase 1 — Contexto (2–3 min)

1. **Problema**: SMBs precisam de CRM + ERP + PDV + atendimento (WhatsApp) + IA, mas hoje usam várias ferramentas desconectadas.
2. **Solução**: Uma plataforma única, multi-tenant, com CRM, ERP, PDV, Finance, Omnichannel e IA integrada.
3. **Público**: Pequenas e médias empresas; foco em simplicidade (design system SMB).

### Fase 2 — Landing / Posicionamento (1–2 min)

4. **Landing (gaqno-landing-ui)**: Mostrar hero, tagline, produtos (CRM, ERP, IA, RPG, Finance, PDV, Omnichannel) com imagens e descrições curtas.
5. **CTA**: Registrar / Entrar — levar para o portal (shell).

### Fase 3 — Portal e produto (5–8 min)

6. **Login** (gaqno-sso-ui via shell): Fluxo único de autenticação.
7. **Shell após login**: Sidebar com Dashboard, PDV, CRM, ERP, Finance, Omnichannel, Wellness, SaaS, Admin.
8. **Dashboard**: Visão geral (cards, uso de serviços, links para Grafana) — “visão única da operação”.
9. **CRM** (2–3 min):  
   - Dashboard/Overview → Vendas (Leads) → Clientes → **AI Marketing (vídeo)**.  
   - Mostrar que CRM não é só pipeline: tem inventário, operações, finance, relatórios, automação e IA.
10. **Omnichannel** (1 min): Inbox, canais, filas — “atendimento unificado com WhatsApp e IA”.
11. **ERP** (1 min): Dashboard → Catálogo ou Pedidos → AI Content.
12. **IA** (1 min): Studio ou Vídeo/Áudio — “IA como produto e dentro do CRM/ERP”.
13. **SaaS/Admin** (opcional): Se o investidor for técnico ou quiser ver multi-tenant: tenants, custos, codemap ou domínios.

### Fase 4 — Tecnologia e operação (2–3 min)

14. **Arquitetura**: Shell + MFE; um login, vários produtos; deploys independentes.
15. **Observabilidade**: Grafana (Front, Backend, DevOps) — “monitoramos tudo”.
16. **Lead enrichment**: Integração Pipedrive + BullMQ — “dados de leads enriquecidos em tempo real”.

### Fase 5 — Fechamento (1–2 min)

17. **Traction**: Clientes piloto, métricas de uso (se houver).
18. **Roadmap**: Próximos módulos ou integrações.
19. **Ask**: Rodada, valor, uso dos recursos.

---

## 3. Melhorias concretas do fluxo

### 3.1 Primeira impressão (entrada no produto)

- **Problema**: Quem acessa `/` no shell vai para `HomePage` → redireciona para `/login` ou `/dashboard`. Não há uma “home” que explique o produto antes de login.
- **Sugestão**:  
  - **Opção A**: Ter uma **landing pública** como entrada principal (ex.: portal.gaqno.com.br redirecionar para landing, e “Entrar” leva ao shell/login).  
  - **Opção B**: No shell, **`/` sem auth** mostrar uma página de apresentação (hero + produtos + botão “Entrar” / “Experimentar”), em vez de ir direto para login.  
- **Benefício**: Investidor vê valor e posicionamento antes de ver tela de login.

### 3.2 Navegação na demo

- **Problema**: Muitos itens no menu (CRM com 11 subáreas, ERP, Finance, Omnichannel, Wellness, SaaS, Admin). Risco de demo perdida.
- **Sugestão**:  
  - Definir **3–5 telas fixas** para a apresentação (ex.: Dashboard → CRM Overview → CRM AI Marketing → Omnichannel Inbox → ERP Pedidos).  
  - Criar um **“modo demo”** ou **playlist de rotas** (botão “Próximo” que leva à próxima tela da história) — opcional, alto impacto.  
  - Ou um **doc interno** (este arquivo) com a ordem exata de cliques/URLs para o apresentador.

### 3.3 Dados e estado da demo

- **Problema**: Telas vazias (sem leads, sem conversas, sem pedidos) passam sensação de “não usado”.
- **Sugestão**:  
  - **Tenant / usuário de demonstração** com dados realistas: alguns leads, 1–2 pipelines com deals, conversas no Omnichannel, pedidos no ERP.  
  - Script ou seed para popular esse tenant (fixtures) e, se possível, resetar após a demo.

### 3.4 Landing → Portal

- **Problema**: Landing (gaqno-landing-ui) e portal (gaqno-shell-ui) podem ser domínios/portas diferentes; o investidor pode não entender que é o mesmo produto.
- **Sugestão**:  
  - Na landing, botão **“Acessar plataforma”** ou **“Entrar”** com link explícito para o shell (ex.: portal.gaqno.com.br ou app.gaqno.com.br).  
  - Mesma identidade visual (logo, cores) entre landing e shell.

### 3.5 Mensagem por produto na demo

- **CRM**: “Aqui você vê vendas, clientes, estoque, operações, financeiro e **IA para marketing (vídeo)** no mesmo lugar.”  
- **Omnichannel**: “Um único inbox para WhatsApp e outros canais, com filas e IA.”  
- **ERP**: “Catálogo, pedidos e estoque; conteúdo gerado por IA.”  
- **IA**: “IA como produto: geração de áudio, imagem, vídeo e uso dentro do CRM/ERP.”  
- **SaaS/Admin**: “Multi-tenant: vários clientes na mesma plataforma, com custos e domínios controlados.”

### 3.6 Redução de ruído

- Esconder ou não enfatizar na primeira demo: **Admin** (muitas abas), **Codemap**, **Wellness** (a menos que seja foco), **RPG** (a menos que seja foco).  
- Deixar **Dashboard, CRM, Omnichannel, ERP, IA** como núcleo da história.

### 3.7 Checklist antes da reunião

- [ ] Landing no ar e com CTAs claros.  
- [ ] Portal (shell) acessível e estável.  
- [ ] Login funcionando (e se possível “Demo” ou usuário pré-logado em dispositivo de apresentação).  
- [ ] Tenant de demo com dados (leads, deals, 1–2 conversas, pedidos).  
- [ ] Grafana acessível (se for mostrar observabilidade).  
- [ ] Roteiro de 3–5 telas definido e testado (ordem de cliques).  
- [ ] Um slide ou doc com: problema, solução, produtos, tech, traction, ask.

---

## 4. Resumo executivo (1 minuto)

**Gaqno** é uma plataforma multi-tenant que integra **CRM, ERP, PDV, Finance, Omnichannel (WhatsApp) e IA** em um único portal. O investidor vê **um login, vários produtos**, arquitetura moderna (MFE, microserviços), **IA no core** (marketing, conteúdo, atendimento) e **observabilidade** (Grafana, Coolify). O fluxo ideal de apresentação é: **contexto → landing → login → dashboard → CRM (com AI Marketing) → Omnichannel → ERP/IA** → tech/observabilidade → fechamento. Melhorar a **primeira impressão** (home/landing antes do login), **dados de demo** e um **roteiro fixo de telas** aumenta a clareza e o impacto da apresentação.
