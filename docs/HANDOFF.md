# HANDOFF.md — Entrada a frio

> Para quem chega **sem** o histórico da conversa (humano ou IA). Descreve o **projeto
> inteiro acumulado**, não só a última fase. Ordem de leitura: `CONCEITO.md` (para quê) →
> `CANONICO.md` (spec técnica) → este arquivo (como operar).

## 1. O que é (em uma frase)
Repositório central de **automações Zoho One** da Trimaf. Cada arquivo é um script/artefato
que roda **dentro do Zoho** (Deluge, Client Script). Não há aplicação com build próprio.

## 2. Arquitetura comum
- Os artefatos rodam no Zoho CRM; o repo guarda **cópias de referência** deles.
- **Padrão recomendado** para automações que precisam de dados/trabalho pesado: **servidor
  faz (função Deluge), Client Script só dispara/renderiza.** O porquê e as pegadinhas estão
  na **Seção 0 do `CANONICO.md`** (PLAT‑1…PLAT‑10) — leia antes de construir a próxima.
- **Não há pipeline de deploy.** Alterou um arquivo aqui? A mudança **não** entra no Zoho
  sozinha — é preciso colar/publicar manualmente no CRM (e vice-versa). Risco estrutural
  registrado em `PENDENCIAS.md` (D3).

## 3. Mapa do projeto (arquivos)
| Arquivo | Automação | Tipo |
|---|---|---|
| `Automacao_Correios.deluge` | Rastreamento Correios | Deluge (automação) |
| `BotãoAtualizarCorreiosLuciene.deluge` | Rastreamento Correios | Deluge (botão) |
| `documentacao_v2025` | Rastreamento Correios | Manual técnico (spec do caso A) |
| `Carga_Prontuario_Matriz_Oficial.js` | Prontuário de Negócios | Client Script |
| `carga_prontuario_negocios.deluge` | Prontuário de Negócios | Função Deluge (servidor) |
| `docs/` | — | Documentação normativa (este conjunto) |
| `.claude/skills/` | — | Skills de processo (auditoria de fase) |

## 4. Inventário de automações e como verificar cada uma

### A) Rastreamento Correios *(pré-existente)*
- **O que faz:** consulta API dos Correios e atualiza status/nota no Deal.
- **Spec:** `documentacao_v2025` (autenticação, endpoints, pontos críticos, troubleshooting).
- **Como verificar:** acionar o botão num Deal com código de rastreio; ver `Status_Correios`
  e a nota de histórico.
- **Estado:** estável/pré-existente. **Não auditado nesta fase.**

### B) Prontuário de Negócios *(fase atual)*
- **O que faz:** no módulo `Reativacoes`, ao mudar o campo `Conta` (onChange), o Client
  Script chama a função servidor `carga_prontuario_negocios_1` e popula o subformulário
  `Prontuario_de_Negocios` com ≤15 negócios da conta, cada linha com o contato real.
- **Spec:** `CANONICO.md` Seção B (gatilho, contrato de colunas, fluxo).
- **Como rodar/testar:**
  1. A função precisa da **REST API OAuth2.0 ligada** (Configuração → Funções → engrenagem →
     REST API) — senão `NOT_ACTIVE`.
  2. Testar a função isolada: Salvar e Executar com `accountId` de uma conta com negócios
     → retorno JSON com as linhas (contato em `Pessoa_Relacionada_Neg_cio`).
  3. Testar ponta a ponta: abrir uma Reativação, trocar a Conta → subformulário preenche;
     log do Client Script mostra `Subform populado: N`.
- **Estado:** **funcionando** (contato real preenchido, sem timeout). Ver dívidas abaixo.

## 5. Como reverter
Cada artefato é um script isolado no Zoho. Reverter = colar a versão anterior (git histórico)
no editor correspondente do Zoho. Não há build/rollback automatizado.

## 6. Armadilhas e dívidas (ler antes de mexer)
- **Pegadinhas da plataforma:** `CANONICO.md` Seção 0 (PLAT‑1…PLAT‑10). As mais mortais:
  Client Script morre em 10 s (PLAT‑1); a busca do navegador não traz lookups como o contato
  (PLAT‑3); o retorno de `execute()` fica em `resp._details.output` (PLAT‑7); `list.toString()`
  do Deluge não põe `[ ]` (PLAT‑8); função só é chamável com REST API OAuth2.0 (PLAT‑6).
- **Dívidas técnicas abertas:** ver `PENDENCIAS.md` (D1 nome da função no arquivo do Client
  Script; D2 coluna `Data_Ganho` órfã; D3 sem pipeline de deploy).

## 7. Mapa concluído × aberto
- **Concluído (não reabrir):** correção da "Pessoa Relacionada" (contato real via função
  servidor); eliminação do timeout de 10 s.
- **Aberto:** "Data Ganho" (não entregue — limitação PLAT‑4/PLAT‑5; caminho futuro COQL);
  as pendências D1/D2/D3.

## 8. Sem testes automatizados
Este repo não tem testes (são scripts Zoho). Verificação é **manual, por execução real** no
Zoho. Não se pode afirmar "zero regressão" por suíte de testes — ver `PENDENCIAS.md`.
