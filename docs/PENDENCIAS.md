# PENDENCIAS.md — O que está aberto

> Honesto por princípio: não marca como entregue o que foi rejeitado ou não verificado.
> Divergências código×canônico desta auditoria entram aqui como defeitos a corrigir
> **deliberadamente** depois (com teste, se houver) — não foram corrigidas durante a
> auditoria (por quê: ver `.claude/skills/skill-auditoria-de-fase/SKILL.md`, passo 6).

## Pendências do desenvolvedor (defeitos / dívidas técnicas)

### D1 — Client Script chama o nome errado da função `[DESVIO código×canônico]`
- **Onde:** `Carga_Prontuario_Matriz_Oficial.js:30` (e comentário em `:8`).
- **O quê:** chama `ZDK.Apps.CRM.Functions.execute('carga_prontuario_negocios', ...)`, mas o
  api_name publicado/canônico é **`carga_prontuario_negocios_1`** (CANONICO B.3; PLAT‑6 sobre
  o sufixo `_N`).
- **Impacto:** o arquivo do repo, se republicado tal como está, chamaria uma função
  inexistente. O que roda no Zoho hoje já usa `_1` (ajustado manualmente pelo líder), então a
  **produção funciona**; o **arquivo** é que está dessincronizado.
- **Correção (futura, deliberada):** trocar a string para `carga_prontuario_negocios_1`
  (linha 30) e atualizar o comentário (linha 8). Mudança trivial; validar republicando e
  testando o onChange.

### D2 — Coluna `Data_Ganho` órfã `[LACUNA]`
- **Onde:** módulo do subform `Prontuario_de_Negocios`, campo `Data_Ganho`
  (id `6482411000030985002`), criado via API nesta fase.
- **O quê:** a feature "Data Ganho" foi **suspensa pelo líder**; nenhuma lógica popula a
  coluna e não há fonte de dado acessível no Deluge (PLAT‑4/PLAT‑5).
- **Correção:** **remover a coluna** do subformulário/módulo (ação do líder — ver abaixo).

### D3 — Sem pipeline de deploy (repo ↔ Zoho manual) `[risco estrutural]`
- **O quê:** os artefatos que rodam de fato (Client Script, função, toggle REST/OAuth2,
  layout do subform, campos criados) são configurados **manualmente no Zoho**. Os arquivos do
  repo são cópias de referência e podem divergir do publicado (é o caso de D1).
- **Correção (a decidir):** definir uma convenção de sincronização (ex.: sempre atualizar o
  arquivo do repo junto com a publicação no Zoho) e/ou avaliar export via API.

## Pendências do líder (decisões / ações no Zoho)
- **Excluir a coluna `Data_Ganho`** do subformulário `Prontuario_de_Negocios` (fecha D2).
- **Validar os itens `[pendente de validação]` do `CANONICO.md`** — em especial o caminho
  futuro da "Data Ganho" via **COQL** (B.6): confirmar se vale retomar algum dia.
- **Decidir sobre D3** (como manter repo e Zoho em sincronia).
- **Confirmar o merge do PR** desta fase (a auditoria não faz merge sozinha).

## Não verificado (honestidade)
- O **texto do Client Script publicado no Zoho** (que chama `_1`) não foi lido diretamente
  por esta auditoria — está `NÃO VERIFICADO` além do relato do líder. O arquivo do repo
  ainda chama o nome sem `_1` (D1).
- **Sem testes automatizados:** não há suíte cobrindo Deluge/Client Script; "zero regressão"
  não é afirmável por teste. Verificação foi por execução real + consultas ao CRM via MCP.
