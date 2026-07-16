# CANONICO.md — Especificação Técnica Canônica

> **Verdade normativa (o que o sistema DEVE SER).** Este documento é a spec técnica à
> qual o código deve se conformar. Quando o código diverge daqui, o defeito é do código
> (ver `../CLAUDE.md` e a regra das duas verdades). Documento **incremental**: cada
> fechamento de fase acrescenta só o delta que aquele trabalho estabeleceu.
>
> Itens marcados **[pendente de validação do líder]** emergiram do trabalho e ainda não
> foram confirmados por Roger.

Repositório: coleção de automações do ecossistema **Zoho One** (Zoho CRM / Deluge /
Client Script). Não há aplicação com build/servidor próprio; cada artefato roda **dentro
do Zoho**. Os arquivos no repo são **cópias de referência** dos scripts publicados no CRM
(ver divergência estrutural em `PENDENCIAS.md`).

Dois subsistemas independentes:

- **(A) Rastreamento Correios** — pré-existente. Spec detalhada em `../documentacao_v2025`.
  Não faz parte desta fase; não re-litigar aqui.
- **(B) Carga do Prontuário de Negócios** — **entregue nesta fase**. Especificado abaixo.

---

## B. Carga do Prontuário de Negócios (subformulário em Reativações)

### B.0 Propósito técnico
Ao selecionar a **Conta** numa **Reativação**, preencher automaticamente o subformulário
**Prontuário de Negócios** com os negócios (Deals) daquela conta — incluindo, em cada
linha, o **contato real** do negócio como lookup clicável para o módulo Contatos.

### B.1 Gatilho e módulos
- Módulo: **`Reativacoes`**.
- Campo gatilho: **`Conta`** — lookup → módulo `Accounts` (ui_type 133). Evento **`onChange`**.
- Subformulário: campo **`Prontuario_de_Negocios`** (data_type `subform`) →
  módulo do subform **`Prontuario_de_Negocios`**.
- Observação: a Reativação tem um contato próprio (`Pessoa_Relacionada_Empresa`,
  lookup→Contacts) que é **distinto** do contato por-negócio do subformulário.

### B.2 Arquitetura (decisão central e seu porquê)
O trabalho pesado roda **no servidor**, numa função Deluge, chamada por um **Client Script
enxuto**. Isto NÃO é preferência — é imposição de duas restrições comprovadas:

- **INV‑1 — Client Script tem limite RÍGIDO de 10 s.** Ultrapassou, aborta com
  "Tempo esgotado". Fonte: Zoho Client Script FAQs.
- **INV‑2 — a busca do navegador (ZDK `searchByCriteria`) NÃO devolve o lookup
  `Contact_Name`.** Comprovado: `deal.Contact_Name` vem `undefined` no registro leve do
  ZDK. Logo, o contato **jamais** pode ser resolvido no navegador. Esta foi a causa raiz.
- Consequência: contas grandes (a conta de teste GRAFICA WILLEJACK tem **101** negócios)
  ainda são todas trazidas ao navegador pelo `searchByCriteria`, o que sozinho já beira os
  10 s. Resolver no servidor elimina os dois problemas de uma vez.

### B.3 Invariantes técnicos do Zoho descobertos nesta fase (o ouro)
Estes fatos só existiam na conversa; são a razão de várias decisões e evitam retrabalho:

- **INV‑3 — servidor tem o contato; navegador não.** No Deluge,
  `zoho.crm.searchRecords("Deals", ...)` devolve `Contact_Name` **inline** como
  `{id, name}`. É por isso que a função servidor funciona.
- **INV‑4 — `zoho.crm.searchRecords` (Deluge) devolve um conjunto de campos MENOR que a
  API REST de busca.** Em particular, **`Stage_Modified_Time` NÃO vem** no searchRecords
  do Deluge (nem no `getRecordById` do Deluge — comprovado com o diagnóstico
  `_dbg_smt = "null"`), embora a API REST o devolva.
- **INV‑5 — `zoho.crm.getRelatedRecords("Stage_History", "Deals", id)` NÃO devolve dados
  dentro do Deluge.** O histórico de estágios é um related list especial, inacessível por
  essa via no Deluge (a API REST o devolve normalmente).
- **INV‑6 — invocar função pelo Client Script:**
  - Chamada: `ZDK.Apps.CRM.Functions.execute('<api_name>', { accountId: '<id>' })`.
  - A função **precisa da REST API ligada (OAuth2.0)** em Configuração → Funções → engrenagem
    → REST API. Sem isso, a chamada falha com
    `NOT_ACTIVE — "api is inactive for the given custom function"`.
  - No editor livre de funções, a categoria aceita é **`automation`** (o editor rejeita
    `standalone`); assinatura: `string automation.carga_prontuario_negocios_1(string accountId)`.
- **INV‑7 — envelope do retorno de `execute()`.** Devolve um **OBJETO**, não a string crua.
  O texto JSON fica em **`resp._details.output`** (não em `resp.output` nem `resp.details.output`).
- **INV‑8 — `list.toString()` no Deluge NÃO inclui os colchetes `[ ]`.** Produz os objetos
  separados por vírgula (`{..},{..}`). O Client Script precisa **envolver com `[ ]`** antes
  do `JSON.parse`.
- **INV‑9 — `ZDK.Client.showLoader()` suspende o timeout de 10 s** enquanto ativo
  (Kaizen #139). Usado como cinto de segurança no Client Script.
- **INV‑10 — lookup em subformulário via `setValue`** aceita `{ id, name }`; o `id` deve ser
  um id válido do módulo-alvo. Para o contato, basta o `id` (o Zoho resolve o nome), mas
  passamos ambos.

### B.4 API name da função
- Nome da API da função publicada: **`carga_prontuario_negocios_1`** (o Zoho acrescentou o
  sufixo `_1` na (re)criação). O Client Script **deve** chamar exatamente esse nome.

### B.5 Contrato de dados (chaves da função → colunas do subform)
A função devolve, por negócio, um objeto cujas chaves são os **api_names das colunas** do
módulo `Prontuario_de_Negocios`. Mapeamento (coluna do subform ← campo do Deal):

| Coluna subform (`Prontuario_de_Negocios`) | Tipo | Origem no Deal |
|---|---|---|
| `Proprietario` | text | `Owner.name` (ou `"Nao atribuido"`) |
| `Montante` | currency | `Amount` (ou 0) |
| `Estagio` | text | `Stage` (ou `"Sem Estagio"`) |
| `Nro_Pedido` | integer | `NroPedidoUniplus` |
| `Nro_Nota` | integer | `NroNotaFiscal` |
| `Nro_Orcamento` | integer | `NroOrcamentoUniplus` |
| `Neg_cio_Relacionado` | lookup → **Deals** | `{ id: deal.id, name: Deal_Name }` |
| `Pessoa_Relacionada_Neg_cio` | lookup → **Contacts** | `{ id: Contact_Name.id, name: Contact_Name.name }` |
| `Data_Ganho` | date | **ABANDONADA** — ver INV‑4/INV‑5 e B.7 |

- Busca dos negócios da conta: critério `(Account_Name:equals:<accountId>)`
  (`Account_Name` é o lookup do Deal para a conta).
- **INV‑11 — teto de 15 linhas** por carga (`conta < 15`).
- **INV‑12 — a coluna "Pessoa Relacionada" DEVE ser lookup para Contatos** (guarda uma
  *pessoa*). Foi considerado e **rejeitado** trocá-la para lookup de Deals: apontaria para um
  negócio (não uma pessoa) e duplicaria `Neg_cio_Relacionado`. O negócio é apenas a *origem*
  que informa **qual** contato.

### B.6 Fluxo em runtime
1. `onChange` da Conta dispara o Client Script.
2. `showLoader()` (INV‑9) → `execute('carga_prontuario_negocios_1', {accountId})`.
3. Extrai `resp._details.output` (INV‑7), envolve com `[ ]` (INV‑8), `JSON.parse`.
4. `subform.setValue(linhas)` → `hideLoader()` no `finally`.
5. Servidor: `searchRecords` dos deals da conta (INV‑3), monta ≤15 linhas com o contato
   real, `return linhas.toString()`.

### B.7 Data do Ganho — NÃO ENTREGUE (limitação conhecida)
Objetivo pretendido: mostrar a **data em que o negócio virou "Closed Won"** (a data que
aparece na linha do tempo/Stage History). **Não foi possível** obter essa data no Deluge:
`Stage_Modified_Time` não vem no `searchRecords`/`getRecordById` do Deluge (INV‑4) e o
`Stage_History` não é acessível via `getRelatedRecords` no Deluge (INV‑5). A coluna de data
`Data_Ganho` chegou a ser **criada** no módulo do subform (id `6482411000030985002`), mas a
feature foi **suspensa pelo líder** e a coluna deve ser removida (ver `PENDENCIAS.md`).
Caminho futuro possível **[pendente de validação do líder]**: consulta **COQL** ao histórico
de estágios (o Deluge aceita COQL), que não sofre das limitações de INV‑4/INV‑5.
