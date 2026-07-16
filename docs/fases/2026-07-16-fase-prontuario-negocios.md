# Relatório de Fase — Carga do Prontuário de Negócios

> **HISTÓRICO — datado. NÃO é o estado atual do projeto.** O estado vivo está em
> `../CANONICO.md`, `../HANDOFF.md` e `../PENDENCIAS.md`.
> Data do fechamento: **2026-07-16**. Branch: `claude/zoho-crm-contact-filter-18irt6`.

## Report técnico

### Escopo da fase
Corrigir a coluna **"Pessoa Relacionada"** do subformulário `Prontuario_de_Negocios` (módulo
`Reativacoes`), que não trazia o contato do negócio. Depois, tentativa de adicionar uma
coluna **"Data Ganho"** — **suspensa pelo líder**.

### Inventário do que foi feito (com prova)
| Arquivo | Mudança | Commit |
|---|---|---|
| `Carga_Prontuario_Matriz_Oficial.js` | Client Script reescrito: de busca no navegador → chamada à função servidor, com loader anti-timeout e parsing do envelope `resp._details.output` + wrap `[ ]` | `47fd9db`→`f915514` |
| `carga_prontuario_negocios.deluge` | Função servidor: `searchRecords` dos deals da conta, monta ≤15 linhas com contato real | `41ea5fc`→`f2d8ed8` |
| `docs/*`, `CLAUDE.md`, `.claude/skills/*` | Documentação normativa + skill de auditoria | fase de fechamento |

Trajetória (resumo dos commits): correção inicial no navegador (`47fd9db`) → timeout 10 s →
loader (`767c913`) → descoberta de que o navegador não traz o contato → virada para função
servidor (`41ea5fc`) → ajustes de categoria/assinatura da função (`b8235f6`,`b53230e`,`cd71fe1`)
→ correção do envelope do retorno (`f915514`) → tentativa "Data Ganho" (`4da24e6`→`6820914`) →
reversão (`f2d8ed8`).

### Auditoria de congruência (3 eixos)
- **(a) Feito × Declarado — CONFORME.** Contato real preenche (saída da função exibe
  `"Pessoa_Relacionada_Neg_cio":{...,"name":"Marcelo Generoso -"}`); timeout eliminado
  (execuções de 0,36 s e 9,14 s observadas). "Data Ganho" honestamente **não entregue**.
- **(b) Feito × Plano — CONFORME.** Correção da "Pessoa Relacionada" = entregue. "Data Ganho"
  suspensa por decisão do líder (não é desvio de escopo). Virada p/ servidor = mudança técnica
  necessária e comunicada.
- **(c) Feito × Canônico — 2 DESVIO + 1 LACUNA** (ver divergências).

### Delta gravado no CANONICO nesta fase
- Seção 0 (plataforma, reutilizável): **PLAT‑1** (10 s), **PLAT‑2** (showLoader),
  **PLAT‑3** (navegador omite lookups), **PLAT‑4** (searchRecords Deluge < REST;
  Stage_Modified_Time ausente), **PLAT‑5** (Stage_History inacessível no Deluge),
  **PLAT‑6** (execute + REST OAuth2 + categoria `automation` + sufixo `_N`),
  **PLAT‑7** (`resp._details.output`), **PLAT‑8** (`toString()` sem `[ ]`),
  **PLAT‑9** (lookup subform `{id,name}`), **PLAT‑10** (sem pipeline de deploy).
- Seção B (caso): contrato de colunas (B.4), **B‑INV‑1** (teto 15), **B‑INV‑2** (contato é
  lookup→Contacts, rejeitado Deals), **B.6** (Data Ganho não entregue; futuro via COQL).

### Divergências código×canônico documentadas
- **D1 — `Carga_Prontuario_Matriz_Oficial.js:30`** (e `:8`): chama `carga_prontuario_negocios`;
  canônico/deploy = `carga_prontuario_negocios_1`. Registrada em `../PENDENCIAS.md`.
- **D2 — `Data_Ganho`** (campo `6482411000030985002` em `Prontuario_de_Negocios`): órfão,
  feature suspensa. Registrada em `../PENDENCIAS.md`.
- **D3 — sem pipeline de deploy** (repo ↔ Zoho manual): risco estrutural. Registrada em
  `../PENDENCIAS.md`.

### Verificação
- **"Banco"/schema (config do Zoho):** verificado via MCP que o módulo `Prontuario_de_Negocios`
  tem as colunas do contrato, incluindo `Data_Ganho` (criado nesta fase). Deals retornam
  `Contact_Name` inline no servidor.
- **Artefatos publicados no Zoho** (Client Script, função, toggle REST/OAuth2): `NÃO
  VERIFICADO` diretamente pela auditoria — confirmados por execução/relato do líder.
- **Testes:** inexistentes (scripts Zoho). "Zero regressão" **não** afirmável por suíte.

### Pendências técnicas
D1, D2, D3 (ver `../PENDENCIAS.md`).

---

## Report executivo (para o líder)

- **Como estava:** o subformulário de negócios da Reativação preenchia tudo, **menos** o
  contato de cada negócio — e, ao tentar resolver, dava "Tempo esgotado".
- **O que foi feito:** descobrimos que a busca feita **no navegador** não entrega o contato e
  estoura o limite de 10 segundos. Movemos o trabalho para o **servidor** (uma função que roda
  no Zoho sem esse limite). Resultado: o contato certo passou a aparecer, como **link clicável
  para a pessoa**, e o travamento acabou.
- **Onde estamos:** **funcionando.** Ficou de fora a "Data do Ganho" — o Zoho **não
  disponibiliza** essa data pelo caminho de servidor que usamos, e você optou por suspender.
- **Próximos passos:** decidir se vale buscar a "Data do Ganho" por outro caminho técnico
  (COQL) no futuro; manter o repositório em sincronia com o que está publicado no Zoho.
- **Pendências:** *(você)* excluir a coluna "Data Ganho"; confirmar o merge. *(dev)* acertar,
  numa próxima sessão, o nome da função dentro do arquivo do Client Script (hoje o que roda no
  Zoho está certo; só o arquivo de referência está desatualizado).
- **Veredito de integridade:** a fase **pode ser fechada com segurança**. O que foi entregue
  está funcionando e verificado por execução real; o que não saiu (Data Ganho) está
  honestamente registrado como não entregue, com o motivo técnico.
