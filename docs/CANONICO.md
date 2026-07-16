# CANONICO.md — Especificação Técnica Canônica

> **Verdade normativa (o que o sistema DEVE SER).** Spec técnica à qual o código deve se
> conformar. Quando o código diverge daqui, o defeito é do código (ver `../CLAUDE.md` e a
> regra das duas verdades). Documento **incremental**: cada fechamento acrescenta só o
> delta daquele trabalho. Itens **[pendente de validação do líder]** ainda não confirmados.

## O que é este projeto
Repositório **central de automações, scripts e integrações** da Trimaf sobre o ecossistema
**Zoho One** (Zoho CRM e afins). Não é uma aplicação com build/servidor próprio: cada
artefato roda **dentro do Zoho** (Deluge, Client Script, funções, workflows). Cada
necessidade operacional do negócio vira uma **automação** (um "caso"); o conjunto **cresce
ao longo do tempo**. Os arquivos versionados aqui são **cópias de referência** dos artefatos
publicados no Zoho.

A seção **0** é o núcleo reutilizável (vale para qualquer automação futura). As seções
**A, B, …** são os casos concretos.

---

## 0. Plataforma Zoho — invariantes e convenções gerais (reutilizáveis)

> Conhecimento que vale para **qualquer** automação nova. Foi caro de descobrir; consulte
> antes de construir a próxima.

**Padrão arquitetural recomendado.** Quando uma automação precisa de dado que o navegador
não enxerga, ou de trabalho pesado/lento, **faça no servidor (Deluge)** e use o **Client
Script apenas como disparador/renderizador fino**. Motivo nos invariantes abaixo.

- **PLAT‑1 — Client Script tem limite RÍGIDO de 10 s.** Ultrapassou, aborta ("Tempo
  esgotado"). Fonte: Zoho Client Script FAQs.
- **PLAT‑2 — `ZDK.Client.showLoader()` suspende esse timeout** enquanto o loader está ativo
  (Kaizen #139). Cinto de segurança para operações mais longas.
- **PLAT‑3 — a busca do navegador (`ZDK.Apps.CRM.<Mod>.searchByCriteria`) devolve um
  registro "leve" que OMITE lookups** (ex.: `Contact_Name` vem `undefined`). Não conte com
  campos de lookup no lado do navegador.
- **PLAT‑4 — o Deluge `zoho.crm.searchRecords` devolve lookups inline (`{id,name}`), mas um
  conjunto de campos MENOR que a API REST.** Confirmado: `Stage_Modified_Time` **não** vem
  no `searchRecords` **nem** no `getRecordById` do Deluge (embora a REST o devolva).
- **PLAT‑5 — related lists especiais de histórico (ex.: `Stage_History`) NÃO são acessíveis
  via `zoho.crm.getRelatedRecords` no Deluge.** Para histórico de estágios, usar **COQL** ou
  a API REST.
- **PLAT‑6 — chamar função de servidor a partir do Client Script:**
  `ZDK.Apps.CRM.Functions.execute('<api_name>', { arg: valor })`. Requisitos:
  - A função **precisa da REST API ligada (OAuth2.0)**: Configuração → Funções → engrenagem →
    REST API. Sem isso: `NOT_ACTIVE — "api is inactive for the given custom function"`.
  - No **editor livre** de funções, a categoria aceita é **`automation`** (rejeita
    `standalone`); assinatura `tipo automation.nome(tipo arg)`.
  - **O Zoho pode acrescentar sufixo `_N`** ao api_name na (re)criação — sempre confira o
    nome real publicado e faça o Client Script chamar exatamente ele.
- **PLAT‑7 — `execute()` devolve um OBJETO, não a string crua.** O retorno da função fica em
  **`resp._details.output`**.
- **PLAT‑8 — `list.toString()` / `Map.toString()` no Deluge produzem JSON SEM os colchetes
  `[ ]` externos** (objetos separados por vírgula). Ao receber no Client Script, **envolva
  com `[ ]`** antes do `JSON.parse`.
- **PLAT‑9 — setar lookup em subformulário** (Client Script `setValue`): valor `{ id, name }`;
  o `id` tem de ser um id válido do módulo-alvo (o Zoho resolve o nome pelo id).
- **PLAT‑10 (convenção) — sem pipeline de deploy.** O que roda de verdade é configurado
  **manualmente no Zoho**; o repo guarda cópias de referência. Manter repo ↔ org em sincronia
  é responsabilidade manual (risco estrutural — ver `PENDENCIAS.md`).

---

## A. Automação: Rastreamento Correios  *(pré-existente — não desta fase)*
Reflete eventos de rastreio dos Correios no módulo Deals (status + nota de histórico).
Implementada em Deluge (botão + automação). **Spec detalhada:** `../documentacao_v2025`.
Arquivos: `../Automacao_Correios.deluge`, `../BotãoAtualizarCorreiosLuciene.deluge`.

---

## B. Automação: Carga do Prontuário de Negócios  *(entregue nesta fase)*

### B.1 Propósito técnico
Ao escolher a **Conta** numa **Reativação**, preencher o subformulário **Prontuário de
Negócios** com os negócios (Deals) daquela conta, cada linha com o **contato real** do
negócio (lookup clicável → Contatos). Realiza o padrão da seção 0 (servidor faz, cliente
renderiza) por causa de PLAT‑1 e PLAT‑3.

### B.2 Gatilho e módulos
- Módulo **`Reativacoes`**, campo gatilho **`Conta`** (lookup→`Accounts`), evento **`onChange`**.
- Subformulário **`Prontuario_de_Negocios`** (campo subform → módulo homônimo).
- A Reativação tem contato próprio `Pessoa_Relacionada_Empresa` (≠ contato por-negócio).

### B.3 Componentes
- **Client Script** `Carga_Prontuario_Matriz_Oficial` (arquivo
  `../Carga_Prontuario_Matriz_Oficial.js`): disparador fino (PLAT‑2/6/7/8).
- **Função servidor** api_name **`carga_prontuario_negocios_1`** (arquivo
  `../carga_prontuario_negocios.deluge`): monta ≤15 linhas via `searchRecords`
  (PLAT‑4 dá o contato inline).

### B.4 Contrato de dados (chave da função → coluna do subform)
| Coluna (`Prontuario_de_Negocios`) | Tipo | Origem no Deal |
|---|---|---|
| `Proprietario` | text | `Owner.name` (ou "Nao atribuido") |
| `Montante` | currency | `Amount` (ou 0) |
| `Estagio` | text | `Stage` (ou "Sem Estagio") |
| `Nro_Pedido` | integer | `NroPedidoUniplus` |
| `Nro_Nota` | integer | `NroNotaFiscal` |
| `Nro_Orcamento` | integer | `NroOrcamentoUniplus` |
| `Neg_cio_Relacionado` | lookup → **Deals** | `{ id: deal.id, name: Deal_Name }` |
| `Pessoa_Relacionada_Neg_cio` | lookup → **Contacts** | `{ id: Contact_Name.id, name: Contact_Name.name }` |
| `Data_Ganho` | date | **ABANDONADA** — ver B.6 |

- Busca: critério `(Account_Name:equals:<accountId>)`.
- **B‑INV‑1 — teto de 15 linhas** por carga.
- **B‑INV‑2 — "Pessoa Relacionada" DEVE ser lookup → Contatos** (guarda uma *pessoa*).
  Rejeitado trocar p/ Deals: apontaria para negócio (não pessoa) e duplicaria
  `Neg_cio_Relacionado`. O negócio é só a *origem* que informa **qual** contato.

### B.5 Fluxo em runtime
1. `onChange` da Conta → Client Script.
2. `showLoader()` → `execute('carga_prontuario_negocios_1', {accountId})`.
3. Lê `resp._details.output` (PLAT‑7), envolve com `[ ]` (PLAT‑8), `JSON.parse`.
4. `subform.setValue(linhas)` → `hideLoader()` no `finally`.
5. Servidor: `searchRecords` dos deals da conta, monta ≤15 linhas com contato real,
   `return linhas.toString()`.

### B.6 Data do Ganho — NÃO ENTREGUE (limitação conhecida)
Objetivo: a data em que o negócio virou "Closed Won" (linha do tempo). Bloqueado por PLAT‑4
(`Stage_Modified_Time` ausente no Deluge) e PLAT‑5 (`Stage_History` inacessível no Deluge). A
coluna `Data_Ganho` foi criada (id `6482411000030985002`) mas a feature foi **suspensa pelo
líder**; a coluna deve ser removida (ver `PENDENCIAS.md`). Caminho futuro **[pendente de
validação]**: **COQL** ao histórico de estágios.
