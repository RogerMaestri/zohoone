# CLAUDE.md — Guardrail do projeto

Carregado automaticamente no início de toda sessão. Enxuto de propósito.

## Normativos (leia antes de mexer)
Este projeto tem o **propósito** em `docs/CONCEITO.md` e a **especificação técnica canônica**
em `docs/CANONICO.md`. Entrada a frio: `docs/HANDOFF.md`. Pendências: `docs/PENDENCIAS.md`.

## Regra das duas verdades
O **código descreve o que É**; **CONCEITO/CANONICO definem o que DEVE SER**. Quando o código
contradiz o canônico, o defeito é do **código** — corrija-o de forma **deliberada e com teste**
(quando houver), **nunca rebaixe a spec** para o que o código faz. Não "conserte" divergências
no meio de uma auditoria/assunção: **registre** em `docs/PENDENCIAS.md`.

## O que este projeto é
Repositório central de **automações Zoho One** (Deluge, Client Script, funções). Cada arquivo
roda **dentro do Zoho**; **não há build nem pipeline de deploy** — os arquivos são cópias de
referência e podem divergir do que está publicado (mantenha em sincronia manualmente).

## Pegadinhas da plataforma Zoho que já custaram caro (detalhe em `docs/CANONICO.md` §0)
Ao construir/alterar uma automação com Client Script + função Deluge:
- **Client Script morre em 10 s** (PLAT‑1). Trabalho pesado → **servidor (Deluge)**; Client
  Script só dispara/renderiza. `ZDK.Client.showLoader()` suspende o timeout (PLAT‑2).
- **A busca do navegador (`searchByCriteria`) NÃO traz lookups** como `Contact_Name` (vem
  `undefined`) — PLAT‑3. No servidor, `zoho.crm.searchRecords` traz (PLAT‑4).
- **`searchRecords`/`getRecordById` do Deluge trazem menos campos que a REST** (ex.:
  `Stage_Modified_Time` ausente) — PLAT‑4. **`getRelatedRecords("Stage_History")` não funciona
  no Deluge** — PLAT‑5. Para histórico, use **COQL**.
- **Chamar função pelo Client Script:** `ZDK.Apps.CRM.Functions.execute('api_name', {arg})`; a
  função precisa da **REST API OAuth2.0 ligada** (senão `NOT_ACTIVE`); no editor livre a
  categoria é **`automation`**; o Zoho pode acrescentar sufixo **`_N`** ao nome — PLAT‑6.
- **Retorno de `execute()` é objeto; o JSON está em `resp._details.output`** — PLAT‑7.
- **`list.toString()` do Deluge NÃO põe `[ ]`** → envolva com `[ ]` antes do `JSON.parse` —
  PLAT‑8.
- **Lookup em subform via `setValue` = `{id, name}`** (id válido do módulo-alvo) — PLAT‑9.

## Ponto de atenção corrente
`Carga_Prontuario_Matriz_Oficial.js:30` chama `carga_prontuario_negocios` — o nome publicado é
`carga_prontuario_negocios_1` (ver `docs/PENDENCIAS.md` D1). Não republicar o arquivo sem
corrigir.
