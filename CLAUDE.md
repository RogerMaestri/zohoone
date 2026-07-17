# CLAUDE.md — Guardrail do projeto

Carregado automaticamente no início de toda sessão. Enxuto de propósito.

## Documentos de referência (leia antes de mexer)
Este projeto tem o **propósito** em `docs/CONCEITO.md` e a **referência técnica**
em `docs/CANONICO.md`. Entrada a frio: `docs/HANDOFF.md`. Pendências:
`docs/PENDENCIAS.md`. Técnicas/descobertas fora da doc oficial:
`docs/APRENDIZADOS.md`.

**Importante:** `CANONICO.md` mistura *fatos de plataforma*, *heurísticas* e
*contratos de casos já entregues*. Não trate heurística (ex.: "prefira Deluge")
como proibição para uma tarefa nova. Leia a tabela "Como ler" no topo do
CANONICO antes de generalizar qualquer PLAT‑N.

## Norma de aprendizado (obrigatória)
Toda técnica não-óbvia que **funcionar** e **não estiver na documentação oficial**
(truque de diagnóstico, quirk de API, pegadinha vencida) **deve ser registrada** —
o fato/quirk vai para `docs/CANONICO.md` (com a classe certa); a técnica de
"como trabalhar/depurar" vai para `docs/APRENDIZADOS.md`. Nunca deixe esse
conhecimento só na conversa.

## Código × documentação
- **Código** descreve o que está implementado (e pode divergir do publicado no
  Zoho — ver PLAT‑10).
- **CANONICO** registra fatos, heurísticas e contratos de casos.
- Divergência de **contrato do caso** (seção B, etc.) → corrigir de forma
  deliberada **ou** registrar em `PENDENCIAS.md`.
- Divergência de **heurística** → pode ser escolha válida; não "consertar" só
  para obedecer o default.
- Divergência de **fato de plataforma** → investigar (bug, API mudou, ou fato
  mal formulado). Não invente trabalho só para parecer alinhado.

## O que este projeto é
Repositório central de **automações Zoho One** (Deluge, Client Script, funções).
Cada arquivo roda **dentro do Zoho**; **não há build nem pipeline de deploy** —
os arquivos são cópias de referência e podem divergir do que está publicado
(mantenha em sincronia manualmente).

## Pegadinhas da plataforma Zoho (detalhe em `docs/CANONICO.md` §0)
Ao construir/alterar uma automação com Client Script + função Deluge, *leve em
conta* (não como lista de vetos):
- **Client Script: teto típico ~10 s** (PLAT‑1). Trabalho longo → Deluge **ou**
  `showLoader()` (PLAT‑2) **ou** outro desenho que caiba no limite.
- **Busca no navegador (`searchByCriteria`) pode omitir lookups** como
  `Contact_Name` — PLAT‑3. No servidor, `zoho.crm.searchRecords` costuma trazer
  (PLAT‑4).
- **`searchRecords`/`getRecordById` do Deluge trazem menos campos que a REST**
  (ex.: `Stage_Modified_Time` ausente) — PLAT‑4. **`getRelatedRecords("Stage_History")`**
  não funcionou no Deluge neste projeto — PLAT‑5. Caminho candidato: **COQL**.
- **Chamar função pelo Client Script:**
  `ZDK.Apps.CRM.Functions.execute('api_name', {arg})`; REST API OAuth2.0 ligada;
  categoria **`automation`** no editor livre; Zoho pode acrescentar sufixo
  **`_N`** ao nome — PLAT‑6.
- **Retorno de `execute()` é objeto; JSON em `resp._details.output`** — PLAT‑7.
- **`list.toString()` do Deluge sem `[ ]`** → envolva antes do `JSON.parse` —
  PLAT‑8.
- **Lookup em subform via `setValue` = `{id, name}`** — PLAT‑9.

## Ponto de atenção corrente
`Carga_Prontuario_Matriz_Oficial.js:30` chama `carga_prontuario_negocios` — o
nome publicado é `carga_prontuario_negocios_1` (ver `docs/PENDENCIAS.md` D1).
Não republicar o arquivo sem corrigir.
