# Relatório de Arquitetura do Projeto: gaqno-development-workspace

Este documento detalha a arquitetura do polirepo `gaqno-development-workspace`, analisando sua estrutura, tecnologias, pacotes compartilhados e fluxo de trabalho.

## 1. Arquitetura Geral do Polirepo

O projeto é um polirepo (monorepo) gerenciado com **Turborepo**, contendo múltiplos serviços de backend (microservices), aplicações de frontend (micro-frontends) e pacotes compartilhados. A arquitetura geral é orientada a serviços e projetada para ser escalável e modular.

- **Microservices (Backend)**: Cada serviço de backend (ex: `gaqno-sso-service`, `gaqno-ai-service`) é uma aplicação **NestJS** independente, responsável por uma área de negócio específica. Eles se comunicam entre si através de chamadas HTTP e, em alguns casos, de forma assíncrona via **Apache Kafka**.
- **Micro-Frontends (Frontend)**: A interface do usuário é dividida em múltiplas aplicações **Next.js/React** (ex: `gaqno-sso-ui`, `gaqno-ai-ui`). Uma aplicação central, `gaqno-shell-ui`, atua como um orquestrador (shell), carregando os outros micro-frontends conforme o usuário navega pela plataforma.
- **Orquestração de Contêineres**: O ambiente de desenvolvimento e produção é orquestrado com **Docker Compose**. Existem dois arquivos principais:
    - `docker-compose.yml`: Define a orquestração de todos os serviços e UIs da plataforma principal, com dependências externas como a base de dados sendo injetadas por variáveis de ambiente.
    - `docker-compose.ai-platform.yml`: Cria um ambiente isolado para a plataforma de IA, incluindo suas próprias instâncias de **PostgreSQL** e **Kafka**, ideal para desenvolvimento e testes focados.
- **Autenticação Centralizada**: O serviço `gaqno-sso-service` atua como um provedor de Single Sign-On (SSO) para toda a plataforma, centralizando a gestão de usuários e autenticação.

## 2. Stack de Tecnologia

A plataforma utiliza um stack de tecnologia moderno e coeso baseado em TypeScript.

- **Frontend**:
    - **Framework**: Next.js (React)
    - **Linguagem**: TypeScript
    - **Estilização**: Tailwind CSS
    - **Componentes**: Shadcn/ui (construído sobre Radix UI)
    - **Gestão de Estado (Servidor)**: TanStack Query (React Query)
    - **Gestão de Estado (Cliente)**: Zustand e React Context
    - **Formulários**: React Hook Form com validação Zod
- **Backend**:
    - **Framework**: NestJS (Node.js)
    - **Linguagem**: TypeScript
    - **ORM**: Drizzle ORM
    - **Mensageria**: Apache Kafka
    - **Validação**: Zod, class-validator
- **Base de Dados**:
    - **Principal**: PostgreSQL
    - **Cache**: Redis (utilizado pelo `omnichannel-service`)
- **DevOps**:
    - **Monorepo Tooling**: Turborepo
    - **Containerização**: Docker

## 3. Análise dos Pacotes Compartilhados

A base do sistema é sustentada por três pacotes compartilhados que garantem consistência e reutilização de código.

### a. `@gaqno-types`
- **Propósito**: Define as interfaces e tipos TypeScript compartilhados entre o frontend e o backend. Garante um "contrato" de dados único e consistente em toda a plataforma, prevenindo erros de integração. Não possui dependências.

### b. `@gaqno-backcore`
- **Propósito**: Uma biblioteca core para os serviços de backend, fornecendo uma base robusta e funcionalidades comuns.
- **Arquitetura Interna**:
    - **Influência de DDD (Domain-Driven Design)**: Estruturado com conceitos como `AggregateRoot`, `DomainEvent` e `SharedKernel`.
    - **Event Sourcing/CQRS**: Possui um módulo `event-store` com implementação do padrão Outbox, indicando o uso de padrões de arquitetura de dados avançados para auditoria e consistência.
    - **Multi-tenancy**: Desenhado desde o início para suportar múltiplos inquilinos (organizações), um requisito chave para plataformas SaaS.
    - **Funcionalidades Reutilizáveis**: Inclui abstrações para Kafka, middlewares, serviços base para CRUD, e guardas de autenticação.

### c. `@gaqno-frontcore`
- **Propósito**: Uma biblioteca de componentes e hooks para as aplicações de frontend.
- **Arquitetura Interna**:
    - **Design System**: Fornece um conjunto rico de componentes de UI (`@/components/ui`), construído com base em Shadcn/ui e Radix, garantindo consistência visual.
    - **Hooks Reutilizáveis**: Encapsula a lógica de negócio e o acesso a dados em React Hooks (ex: `useAIModels`, `useTenants`), mantendo os componentes de UI limpos.
    - **Gestão de Estado Centralizada**: Fornece contextos (`AuthContext`) e stores (`zustand`) para gerenciar o estado global da aplicação.
    - **Clientes de API**: Disponibiliza clientes de API tipados para interagir com os serviços de backend de forma segura.

## 4. Detalhamento de cada Serviço e UI

A maioria dos diretórios de serviço e UI no repositório parecem ser placeholders. A análise detalhada foi feita com base no `gaqno-lead-enrichment-service` como exemplo representativo de um microserviço.

### `gaqno-lead-enrichment-service`
- **Propósito**: Um consumidor Kafka que escuta por eventos de novos leads e os enriquece com informações de uma API externa (Pipedrive).
- **Tecnologias**:
    - **Framework**: NestJS
    - **Dependências Chave**: `@gaqno-backcore`, Drizzle ORM, `kafkajs`, `axios`.
- **Análise**: Este serviço é um exemplo clássico de um microserviço bem definido: tem uma responsabilidade única, é orientado a eventos e integra-se com outros sistemas. Ele utiliza a base do `@gaqno-backcore` para se conectar à infraestrutura (base de dados, Kafka) e herdar as configurações comuns.

## 5. Fluxo de Trabalho de Desenvolvimento

O fluxo de trabalho de desenvolvimento é otimizado pela utilização de Turborepo e Docker.

### Como Iniciar o Projeto
1. **Configurar o Ambiente**: Criar um arquivo `.env` na raiz do projeto com as variáveis de ambiente necessárias (credenciais de base de dados, segredos JWT, etc.).
2. **Subir a Infraestrutura**: Utilizar o `docker-compose` para iniciar os serviços.
   - Para a plataforma principal: `docker-compose up -d`
   - Para o ambiente de IA isolado: `docker-compose -f docker-compose.ai-platform.yml up -d`
3. **Desenvolvimento Local**: Navegar para a pasta de um pacote específico (ex: `cd gaqno-ai-ui`) e executar o script de desenvolvimento (ex: `npm run dev`).

### Como Construir o Projeto
- Para construir todos os pacotes e aplicações do monorepo de forma otimizada, execute o seguinte comando na raiz do projeto:
  ```bash
  npx turbo build
  ```
  O Turborepo irá gerenciar o grafo de dependências e utilizar o cache para acelerar builds subsequentes.

### Como Testar o Projeto
- Para executar os testes em todos os pacotes, utilize o Turborepo:
  ```bash
  npx turbo test
  ```
