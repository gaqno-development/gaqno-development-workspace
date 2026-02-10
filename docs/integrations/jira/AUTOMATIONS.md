# Regras Jira Automation (GAQNO)

Especificação das regras de automatização para criar em **Configuração do projeto GAQNO → Automatização**. Não existe API pública para criá-las; use esta especificação para copiar/criar no Jira.

---

## 1. Story em andamento → Épico em andamento

**Nome:** Story em andamento → Épico em andamento

**Disparo:** Transição de issue → **Para:** Em andamento

**Condições:**

- Tipo de issue = Story
- Campo Epic Link (ou Epic link) não está vazio

**Ação:** Transicionar issue → **Issue:** valor do campo Epic Link → **Transição:** a que leva ao status Em andamento

**Passos no Jira:**

1. Automatização → Criar regra.
2. Nome: `Story em andamento → Épico em andamento`.
3. Disparo: Transição de issue → De: (qualquer) → Para: `Em andamento`.
4. Condição: Tipo de issue = `Story`.
5. Condição: Campo do issue → Epic Link → não está vazio.
6. Ação: Transicionar issue → Issue: Epic Link (issue do campo) → Transição: Em andamento.
7. Salvar e ativar.

---

## 2. Ao ir para Em andamento — Set Started

**Nome:** Ao ir para Em andamento — Set Started

**Disparo:** Transição de issue → **Para:** Em andamento

**Condições:** (nenhuma)

**Ação:** Editar issue → Campo **Started** (Data de início) = agora

**Passos no Jira:**

1. Automatização → Criar regra.
2. Nome: `Ao ir para Em andamento — Set Started`.
3. Disparo: Transição de issue → De: (qualquer) → Para: `Em andamento`.
4. Ação: Editar issue → Campo: Started (Data de início) → Valor: data/hora atual.
5. Salvar e ativar.

---

## 3. Ao concluir — Set Resolution date

**Nome:** Ao concluir — Set Resolution date

**Disparo:** Transição de issue → **Para:** Concluído

**Condições:** (nenhuma)

**Ação:** Editar issue → Campo **Resolution date** (Data de resolução) = agora

**Passos no Jira:**

1. Automatização → Criar regra.
2. Nome: `Ao concluir — Set Resolution date`.
3. Disparo: Transição de issue → De: (qualquer) → Para: `Concluído`.
4. Ação: Editar issue → Campo: Resolution date (Data de resolução) → Valor: data/hora atual.
5. Salvar e ativar.

---

## 4. Issue criado no GAQNO (opcional)

**Nome:** Issue criado no GAQNO — componente padrão

**Disparo:** Issue criado

**Condições:** Projeto = GAQNO

**Ação:** Editar issue → Definir componente padrão (ou pular se não houver componente único padrão)

**Passos no Jira:**

1. Automatização → Criar regra.
2. Nome: `Issue criado no GAQNO — componente padrão`.
3. Disparo: Issue criado.
4. Condição: Projeto = GAQNO.
5. Ação: Editar issue → Componente(s): escolher o componente padrão desejado (ou omitir esta regra se não for usar componente padrão).
6. Salvar e ativar.

---

## Troubleshooting: “Esse épico não pode ser movido para essa coluna…”

Esse erro no board **Epicos (71)** costuma ocorrer quando o **fluxo de trabalho (workflow)** do tipo **Epic** não está alinhado com o do resto do projeto.

**Causas comuns:**

1. **Epic usa outro workflow** — No GAQNO o alvo é um único workflow com 3 status: Backlog | Em andamento | Concluído. Se o tipo _Epic_ estiver associado a um workflow diferente (ou antigo) que não tem o status “Em andamento” ou a transição com esse nome, o Jira bloqueia a mudança de coluna.
2. **Transição com condição/permissão** — A transição que leva ao status “Em andamento” pode ter condição (ex.: “apenas assignee”) ou permissão que o usuário ou a automação não atendem.
3. **Coluna do board** — A coluna “Em andamento” do board 71 precisa estar mapeada para o status “Em andamento” do workflow que o Epic usa.

**O que fazer no Jira:**

1. **Configuração do projeto GAQNO** → **Fluxos de trabalho**.
2. Verificar qual workflow está associado ao tipo **Epic** (e aos tipos Story/Task).
3. **Garantir que Epic use o mesmo workflow** que Story/Task (o que tem Backlog → Em andamento → Concluído). Se Epic estiver em outro esquema, alterar a associação do tipo Epic para o workflow correto.
4. No workflow usado pelos Epics, conferir:
   - existe o status **Em andamento**;
   - existe uma transição (ex.: “Iniciar” ou “Em andamento”) cujo destino é “Em andamento”;
   - essa transição não tem condições ou permissões que impeçam o usuário (ou a regra de automação) de executá-la.
5. No **board 71 (Epicos)** → **Configuração do board** → **Colunas**: garantir que a coluna “Em andamento” está mapeada para o status “Em andamento” desse mesmo workflow.

Depois disso, mover o Épico manualmente para “Em andamento” no board 71 deve funcionar, e a regra **Story em andamento → Épico em andamento** também conseguirá transicionar o Epic Link para Em andamento.
