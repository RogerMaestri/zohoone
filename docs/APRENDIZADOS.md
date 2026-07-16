# APRENDIZADOS.md — Técnicas e descobertas fora da documentação oficial

> **Caderno vivo.** Aqui mora o conhecimento que **deu certo na prática** e que **não está
> na documentação oficial** do Zoho/ferramentas — técnicas de diagnóstico, pegadinhas de
> APIs, truques que economizam horas. É diferente do `CANONICO.md` (que é a *spec* à qual o
> código obedece): aqui é **"como trabalhar e depurar"**, para o próximo agente (ou o
> próprio Roger) reusar em casos futuros, sem quem descobriu por perto.
>
> **Norma:** toda vez que uma técnica não-óbvia funcionar e não estiver na doc oficial,
> **acrescente aqui** — data, o que é, por que importa, e um exemplo concreto. Nunca deixe
> só na conversa.

---

## 2026-07-16 — Depuração de automações Zoho (Client Script + Deluge)

### T1 · Use o Zoho CRM via API REST (MCP) para "ver o que o servidor vê"
**O quê:** quando um Client Script (ZDK) ou uma função Deluge se comporta estranho, consulte
o **mesmo dado pela API REST** (aqui, via as ferramentas do Zoho CRM MCP: `searchRecords`,
`getRecord`, `getRelatedRecords`, `getFields`). A REST devolve o registro **completo** e é a
"fonte da verdade" para comparar contra o que a camada de execução (navegador/Deluge) entrega.

**Por que importa:** foi assim que provei, sem adivinhar, três coisas centrais desta sessão:
- `Contact_Name` existe no negócio (REST `searchRecords` mostra `{id,name}` inline) → logo, o
  `undefined` no navegador é limitação do **ZDK**, não falta de dado.
- `Stage_History` é retornado pela **REST** `getRelatedRecords`, mas **não** pelo Deluge → a
  limitação é do **Deluge**, não do CRM.
- Comparar o field-set da REST com o que o Deluge `searchRecords` traz revelou que o Deluge
  **omite campos** (ex.: `Stage_Modified_Time`).

**Como usar:** reproduza a MESMA busca/critério do script pela REST e compare campo a campo.
O que aparece na REST e some no script = limitação da camada de execução, não do dado.

### T2 · Campo de diagnóstico temporário no retorno da função
**O quê:** para ver o que a função Deluge realmente lê em runtime, coloque uma **chave extra
temporária** no objeto de retorno (ex.: `row.put("_dbg_smt", valor + "")`). No Client Script,
o `setValue` **ignora** chaves que não são colunas do subform, então isso não quebra a tela —
mas aparece no JSON do **Salvar e Executar** da função.

**Por que importa:** foi o que mostrou, de forma inequívoca, `"_dbg_smt":"null"` — provando
que `Stage_Modified_Time` não vinha nem via `getRecordById` no Deluge. Diagnóstico em 1 rodada
em vez de tentativa-e-erro.

**Regra:** remover o campo `_dbg_*` depois de diagnosticar.

### T3 · Descobrir o formato de retorno logando o objeto cru
**O quê:** ao integrar duas camadas (ex.: `ZDK.Apps.CRM.Functions.execute` → Client Script),
**logue o retorno cru** com `log('DEBUG resp = ' + JSON.stringify(resp))` antes de tentar
parsear. O formato real quase nunca é o que a doc sugere.

**Por que importa:** revelou que `execute()` devolve um **objeto** e o JSON útil está em
`resp._details.output` (não em `resp.output`). Sem o dump, teria sido chute.

### T4 · Quirks do COQL (`executeCOQLQuery`)
Aprendidos na marra, não estão claros na doc:
- **Exige cláusula `WHERE` sempre.** Sem ela: `SYNTAX_ERROR — "missing clause: where"`.
  Truque para "todos": `where id is not null`.
- **Agregação é restritiva.** `count(id)` no `ORDER BY`/`GROUP BY` deu
  `INVALID_QUERY — "select column should be given in group by clause"`. Para contagens
  simples, prefira paginar/contar do lado do cliente ou ajustar o group by com cuidado.
- COQL é um **caminho alternativo** quando o Deluge não alcança algo (ex.: histórico de
  estágios que `getRelatedRecords` não traz no Deluge — ver `CANONICO.md` PLAT‑5).

### T5 · `createFields` cria coluna de subformulário via API
**O quê:** dá para criar uma coluna num **módulo de subformulário** (ex.:
`Prontuario_de_Negocios`) programaticamente com `createFields` (data_type `date`, etc.), sem
mexer na UI. O `api_name` é gerado a partir do label (ex.: "Data Ganho" → `Data_Ganho`).

**Cuidado:** criar o campo no módulo **não** o adiciona automaticamente à exibição do
subformulário no layout — pode ser preciso arrastá-lo no editor de layout. E lembre: sem
pipeline de deploy, o schema real vive no Zoho (ver PLAT‑10).

---

<!-- Próximos aprendizados entram acima desta linha, com data e no mesmo formato. -->
