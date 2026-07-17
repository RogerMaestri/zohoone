# CANONICO.md — Referência técnica do projeto

> Caderno técnico compartilhado: o que já sabemos sobre a plataforma Zoho neste
> repositório, o que recomendamos por experiência, e o contrato das automações
> já entregues. **Não é dogma.** Outras automações podem adotar caminhos
> diferentes se respeitarem os *limites reais da plataforma* e o propósito do
> negócio. Documento **incremental**: cada fechamento acrescenta só o delta
> daquele trabalho. Itens **[pendente de validação do líder]** ainda não
> confirmados.

### Como ler (obrigatório para agentes e humanos)

Trate cada trecho conforme a classe abaixo — **não colapse tudo numa única
"verdade normativa":**

| Classe | Significado | Se o código divergir |
|---|---|---|
| **Fato de plataforma** | Comportamento/restrição observada do Zoho (com fonte ou reprodução) | Investigar: pode ser bug, mudança da Zoho, ou leitura errada do fato |
| **Heurística** | Padrão que funcionou bem *neste* contexto; default sugerido | Pode ser escolha deliberada — documente o porquê |
| **Contrato do caso** | Spec da automação já entregue (módulos, campos, api_names) | Divergência = débito a registrar em `PENDENCIAS.md` ou correção deliberada |

Quando houver tensão entre este arquivo e o código: **não rebaixe fatos de
plataforma** para acomodar bug; **não use heurística para proibir tentativa**
em tarefa nova sem antes checar se o limite real se aplica.

Propósito do produto: `../CONCEITO.md` (se existir) / entrada a frio:
`HANDOFF.md`. Técnicas de depurar: `APRENDIZADOS.md`.

## O que é este projeto
Repositório **central de automações, scripts e integrações** da Trimaf sobre o
ecossistema **Zoho One** (Zoho CRM e afins). Não é uma aplicação com
build/servidor próprio: cada artefato roda **dentro do Zoho** (Deluge, Client
Script, funções, workflows). Cada necessidade operacional do negócio vira uma
**automação** (um "caso"); o conjunto **cresce ao longo do tempo**. Os arquivos
versionados aqui são **cópias de referência** dos artefatos publicados no Zoho.

A seção **0** é conhecimento reutilizável (vale consultar antes de construir).
As seções **A, B, …** são os casos concretos já especificados.

---

## 0. Plataforma Zoho — fatos observados e heurísticas

> Conhecimento caro de descobrir. Use como **mapa de riscos**, não como lista de
> proibições absolutas. Antes de generalizar um PLAT‑N para uma tarefa *nova*,
> confirme se aquele limite realmente afeta o desenho proposto.

### 0.1 Fatos de plataforma (restritivos ou quirks)

- **PLAT‑1 — Client Script: teto típico de ~10 s.** `[fato]` Ultrapassado, a
  execução aborta ("Tempo esgotado"). Fonte: Zoho Client Script FAQs. Isto
  **não** proíbe lógica no Client Script; proíbe assumir que trabalho longo
  cabe no cliente sem mitigação.
- **PLAT‑2 — `ZDK.Client.showLoader()` pode suspender esse timeout** enquanto o
  loader está ativo (Kaizen #139). `[fato / mitigação]` Cinto de segurança para
  operações mais longas no cliente — alternativa válida a "mover tudo ao
  servidor", conforme o caso.
- **PLAT‑3 — busca no navegador omite lookups.** `[fato empírico]`
  `ZDK.Apps.CRM.<Mod>.searchByCriteria` devolve registro "leve": lookups como
  `Contact_Name` podem vir `undefined`. Não conte com esses campos no lado do
  navegador *nessa API*.
- **PLAT‑4 — Deluge `searchRecords` ≠ REST completa.** `[fato empírico]`
  `zoho.crm.searchRecords` devolve lookups inline (`{id,name}`), mas um conjunto
  de campos menor que a API REST. Confirmado neste projeto:
  `Stage_Modified_Time` **não** veio no `searchRecords` **nem** no
  `getRecordById` do Deluge (embora a REST o devolva).
- **PLAT‑5 — `Stage_History` via `getRelatedRecords` no Deluge.** `[fato empírico]`
  Related lists especiais de histórico (ex.: `Stage_History`) **não** foram
  acessíveis via `zoho.crm.getRelatedRecords` no Deluge neste projeto. Para
  histórico de estágios, caminhos candidatos: **COQL** ou API REST.
- **PLAT‑6 — chamar função de servidor a partir do Client Script.** `[fato]`
  `ZDK.Apps.CRM.Functions.execute('<api_name>', { arg: valor })`. Requisitos
  observados:
  - A função **precisa da REST API ligada (OAuth2.0)**: Configuração → Funções →
    engrenagem → REST API. Sem isso: `NOT_ACTIVE — "api is inactive for the
    given custom function"`.
  - No **editor livre** de funções, a categoria aceita foi **`automation`**
    (rejeitou `standalone`); assinatura `tipo automation.nome(tipo arg)`.
  - **O Zoho pode acrescentar sufixo `_N`** ao api_name na (re)criação — confira
    o nome real publicado e faça o Client Script chamar exatamente ele.
- **PLAT‑7 — retorno de `execute()`.** `[fato]` Devolve um **objeto**, não a
  string crua. O retorno da função ficou em **`resp._details.output`**.
- **PLAT‑8 — `list.toString()` / `Map.toString()` no Deluge.** `[fato]` Produzem
  JSON **sem** os colchetes `[ ]` externos (objetos separados por vírgula). Ao
  receber no Client Script, **envolver com `[ ]`** antes do `JSON.parse` foi o
  caminho que funcionou aqui.
- **PLAT‑9 — setar lookup em subformulário** (Client Script `setValue`). `[fato]`
  Valor `{ id, name }`; o `id` precisa ser id válido do módulo-alvo (o Zoho
  resolve o nome pelo id).

### 0.2 Heurísticas de desenho (defaults, não mandamentos)

- **HEUR‑1 — preferir servidor para trabalho pesado/lento ou dado que o
  navegador não enxerga.** `[heurística]` Motivada por PLAT‑1 e PLAT‑3 no caso
  do Prontuário: função Deluge monta os dados; Client Script dispara, mostra
  loader e renderiza. **Não** leia isto como "nunca use Client Script".
  Tentativas no cliente são legítimas se couberem no teto (ou usarem PLAT‑2) e
  se as APIs do navegador forem suficientes.
- **PLAT‑10 (convenção do repo) — sem pipeline de deploy.** `[convenção]` O que
  roda de verdade é configurado **manualmente no Zoho**; o repo guarda cópias de
  referência. Manter repo ↔ org em sincronia é responsabilidade manual (risco
  estrutural — ver `PENDENCIAS.md`).

---

## A. Automação: Rastreamento Correios  *(pré-existente — não desta fase)*
Reflete eventos de rastreio dos Correios no módulo Deals (status + nota de
histórico). Implementada em Deluge (botão + automação). **Spec detalhada:**
`../documentacao_v2025`. Arquivos: `../Automacao_Correios.deluge`,
`../BotãoAtualizarCorreiosLuciene.deluge`.

---

## B. Automação: Carga do Prontuário de Negócios  *(entregue nesta fase)*
`[contrato do caso]` — aplica-se a **esta** automação. Não exportar como regra
geral para tarefas não relacionadas.

### B.1 Propósito técnico
Ao escolher a **Conta** numa **Reativação**, preencher o subformulário
**Prontuário de Negócios** com os negócios (Deals) daquela conta, cada linha com
o **contato real** do negócio (lookup clicável → Contatos).

Desenho adotado: servidor monta, cliente renderiza (HEUR‑1), porque neste caso
precisávamos de lookups (PLAT‑3) e a busca no navegador estourava o teto
(PLAT‑1). Outro desenho seria válido se resolvesse os mesmos requisitos.

### B.2 Gatilho e módulos
- Módulo **`Reativacoes`**, campo gatilho **`Conta`** (lookup→`Accounts`),
  evento **`onChange`**.
- Subformulário **`Prontuario_de_Negocios`** (campo subform → módulo homônimo).
- A Reativação tem contato próprio `Pessoa_Relacionada_Empresa` (≠ contato
  por-negócio).

### B.3 Componentes
- **Client Script** `Carga_Prontuario_Matriz_Oficial` (arquivo
  `../Carga_Prontuario_Matriz_Oficial.js`): disparador/renderizador (usa
  PLAT‑2/6/7/8).
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
- **B‑INV‑2 — "Pessoa Relacionada" DEVE ser lookup → Contatos** (guarda uma
  *pessoa*). Rejeitado trocar p/ Deals: apontaria para negócio (não pessoa) e
  duplicaria `Neg_cio_Relacionado`. O negócio é só a *origem* que informa
  **qual** contato.

### B.5 Fluxo em runtime
1. `onChange` da Conta → Client Script.
2. `showLoader()` → `execute('carga_prontuario_negocios_1', {accountId})`.
3. Lê `resp._details.output` (PLAT‑7), envolve com `[ ]` (PLAT‑8), `JSON.parse`.
4. `subform.setValue(linhas)` → `hideLoader()` no `finally`.
5. Servidor: `searchRecords` dos deals da conta, monta ≤15 linhas com contato
   real, `return linhas.toString()`.

### B.6 Data do Ganho — NÃO ENTREGUE (limitação conhecida)
Objetivo: a data em que o negócio virou "Closed Won" (linha do tempo).
Bloqueado, *neste stack Deluge*, por PLAT‑4 (`Stage_Modified_Time` ausente) e
PLAT‑5 (`Stage_History` inacessível via `getRelatedRecords`). A coluna
`Data_Ganho` foi criada (id `6482411000030985002`) mas a feature foi
**suspensa pelo líder**; a coluna deve ser removida (ver `PENDENCIAS.md`).
Caminho futuro **[pendente de validação]**: **COQL** ao histórico de estágios.
