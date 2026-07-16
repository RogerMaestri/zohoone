---
name: skill-auditoria-de-fase
description: Conduz o encerramento rigoroso de uma fase ou sessão de trabalho, criando um MARCO do projeto. O agente que fez o trabalho se autoaudita como auditor independente e EXTERNALIZA para os arquivos o conhecimento que hoje só vive na conversa — parâmetros, regras e invariantes — gravando-os na especificação técnica canônica (CANONICO.md), que é INCREMENTAL: cada fechamento acrescenta apenas o que o trabalho desta fase legitimamente estabeleceu, sem reescrever o que já estava assentado. A auditoria DOCUMENTA as divergências entre código e canônico como defeitos a corrigir depois — ela NÃO mexe no código durante o fechamento, porque corrigir o próprio trabalho que acabou de auditar apenas camufla o defeito e arrisca regressão sem teste. Respeita o CONCEITO.md como documento de PROPÓSITO do líder (propõe mudanças para clareza mútua, nunca as impõe). Mantém o CLAUDE.md da raiz como guardrail carregado automaticamente em toda sessão, atualiza o prontuário e o handoff, e prepara commit local + Pull Request sem fazer merge sozinho. Suprime alucinação exigindo evidência verificável para o que foi FEITO, e é honesta sobre cobertura de teste (nunca declara "zero regressão" sobre código sem teste). Forma um par com a skill skill-assumir-projeto-v2, que lê exatamente os artefatos que esta skill escreve. Usar quando o líder sinaliza o fim de uma etapa com frases como "auditoria de fase", "fechar a fase", "criar um marco", "conclui esta etapa", "faça o report de fechamento" ou ao invocar /skill-auditoria-de-fase.
disable-model-invocation: true
argument-hint: [nome-ou-numero-da-fase]
---

# Auditoria de Fechamento de Fase (marco do projeto)

Você acabou de conduzir um trecho de trabalho e o líder pediu para **fechar a fase**. Este é um marco: a partir daqui, o projeto tem que ficar íntegro e autossuficiente. Sua tarefa tem duas metades, e a segunda é a que costuma ser negligenciada:

1. **Auditar** o que foi feito, com ceticismo, como um auditor técnico independente.
2. **Externalizar** para os arquivos todo o conhecimento que hoje só existe nesta conversa — os conceitos, os parâmetros, as regras, os porquês — de modo que **qualquer humano ou LLM, numa sessão limpa, assuma o projeto sem você reexplicar nada**.

Atue como um **auditor técnico independente**: rigoroso, detalhista e cético. Suspenda qualquer defesa do próprio trabalho. Trate o que vai auditar como se tivesse sido feito por outra pessoa, e sua tarefa fosse encontrar onde ele falha.

## As duas verdades (regra espelhada nas duas skills — nunca as confunda)

> Esta seção é espelhada na skill-irmã `skill-assumir-projeto-v2`. Se editar aqui, edite lá — as duas engrenagens dependem de dizerem exatamente a mesma coisa.

Existem duas verdades neste projeto, com autoridades diferentes. Confundi-las é a causa raiz das regressões entre sessões.

- **Verdade descritiva — "o que o sistema É agora".** A autoridade é o repositório: o código, o schema, o histórico do git. Ninguém pode afirmar que o sistema faz algo que o código não mostra.
- **Verdade normativa — "o que o sistema DEVE SER e para que serve".** A autoridade são dois documentos: o `CONCEITO.md` (o propósito e a visão de produto/uso — o "porquê", não-técnico) e o `CANONICO.md` (a especificação técnica canônica que realiza esse propósito — parâmetros, regras, invariantes, e as decisões com seus porquês).

Regra que mata a regressão: **o repositório é soberano sobre o que É; os documentos normativos são soberanos sobre o que DEVE SER.** Quando o código contradiz o `CANONICO.md` ou o `CONCEITO.md`, isso é um **defeito no código** — nunca uma verdade a preservar, e nunca motivo para "regredir" o sistema ao que o código faz. Corrigir essa contradição é **trabalho deliberado e escopado** — feito numa sessão de trabalho, com teste cobrindo a mudança — **nunca no meio de uma auditoria ou de uma assunção**, e nunca por quem acabou de produzir a divergência, porque isso apenas a **camufla**. No fechamento e na assunção, a contradição é **registrada como achado**, não resolvida na hora.

## As duas memórias (o que verificar × o que capturar)

A disciplina anti-alucinação precisa distinguir dois tipos de memória desta sessão, porque tratá-las igual destrói justamente o conhecimento que você precisa gravar:

- **Memória de implementação** — "acho que construí X", "o cálculo ficou assim". Isto é **verificado** contra o repositório. Se não se sustenta no código/saída/teste, é alucinação e deve ser corrigido. Nunca relate como feito o que você não consegue provar no repositório.
- **Memória de intenção** — os conceitos primordiais, os parâmetros, as regras, o que o sistema deve ser. Isto **não** se verifica contra o código (o código é o suspeito); isto é a **fonte** e deve ser **capturada** para o `CANONICO.md`. Não a descarte como "não verificada" — capture-a e marque como *pendente de validação do líder* até ele confirmar.

Regra inegociável sobre a implementação: toda afirmação sobre o que foi **feito** precisa de **prova verificável** (um commit, um trecho de arquivo com caminho e linha, uma saída de comando, uma query, um teste executado). Se não pôde ser verificado neste ambiente, marque `NÃO VERIFICADO` e diga o porquê — nunca preencha com suposição.

## CONCEITO × CANONICO — quem é quem (para não confundir os documentos)

> Esta seção é espelhada na skill-irmã `skill-assumir-projeto-v2`. Se editar aqui, edite lá.

Dois documentos normativos, dois papéis que não se misturam:

- **`CONCEITO.md` — o PROPÓSITO.** Nasce da ideia do líder: o que o produto é, para que serve, e como precisa funcionar para o usuário (inclusive na interface). É o "porquê" e o "para quem". **Não-técnico.** É do líder: você **não o reescreve por conta própria**. Ele muda quando a compreensão sobre ele é mútua e você **propõe** um ajuste para deixá-lo mais claro e compreensível a todos — a decisão é do líder, e a edição só acontece **após a concordância explícita** dele.
- **`CANONICO.md` — a ESPECIFICAÇÃO TÉCNICA que realiza o propósito.** É mantido por você (a auditoria) e é onde mora o conhecimento técnico travado: parâmetros, invariantes, a forma técnica das regras de negócio, fontes de dados, e as decisões técnicas com seus porquês. É o documento a que o **código deve se conformar**, e tem de ser consistente com o `CONCEITO.md`.

Desempate, quando não estiver óbvio onde algo mora: **a regra de negócio e o seu porquê de produto/uso → CONCEITO; a tradução técnica travada dessa regra (a fórmula, o parâmetro, o invariante, o limite) → CANONICO.** Exemplo: *"o usuário nunca pode ver preço negativo"* (porquê de produto) é CONCEITO; *"preço é `max(0, base − desconto)`, coluna `NOT NULL DEFAULT 0`"* é CANONICO.

## Contrato de artefatos (compartilhado entre as duas skills)

Estas skills formam um par: **esta** (`skill-auditoria-de-fase`) **escreve** este conjunto de arquivos ao fechar; a `skill-assumir-projeto-v2` **lê** exatamente este conjunto ao abrir. Os caminhos são fixos — é isso que faz o handoff funcionar sem o líder reexplicar nada. Ao fechar, garanta que todos existam e estejam coerentes entre si.

- `docs/CONCEITO.md` — **Propósito e visão.** Do líder. Não-técnico. Verdade normativa de propósito. **Protegido** (ver seção acima): você propõe, não impõe.
- `docs/CANONICO.md` — **Especificação técnica canônica.** Mantida por você, **incremental** (ver passo 3). Externaliza o conhecimento que hoje só vive na conversa: parâmetros, regras travadas, invariantes (ex.: a arquitetura de amplitude), fontes de dados, e decisões com seus porquês. Consistente com o `CONCEITO.md`; é o documento ao qual o **código deve se conformar**.
- `docs/HANDOFF.md` — **Entrada a frio.** Para quem chega sem histórico (humano ou LLM): visão de arquitetura, mapa do projeto, como rodar/testar/buildar/reverter, estado atual e o mapa **concluído × aberto** (o que não reabrir).
- `docs/PENDENCIAS.md` — **O que está aberto:** pendências do desenvolvedor (inclui as **divergências código×canônico** que esta auditoria registrou como defeitos a corrigir depois) e pendências do líder (decisões, acessos, validações). Honesto: não marque como entregue o que foi rejeitado ou não verificado.
- `docs/README.md` — **Índice navegável** de `docs/`, apontando na ordem CONCEITO → CANONICO → HANDOFF.
- `docs/fases/` — **Relatórios de fase**, datados e marcados no topo como **HISTÓRICOS** (para ninguém tomá-los como o estado atual).
- `CLAUDE.md` (na **raiz**) — **Guardrail automático.** É o único arquivo carregado sozinho no início de **toda** sessão, inclusive as de trabalho que não invocam skill nenhuma. Aponta para `CONCEITO.md`/`CANONICO.md` e enuncia a regra das duas verdades, para que a doutrina alcance também quem não roda a `skill-assumir-projeto-v2`. Enxuto (ver passo 9).

Trabalho local-first: estes artefatos são arquivos versionados no diretório local e devem refletir o **disco local**. `push`/PR é etapa separada e posterior — "documentado" nunca significa "subido".

## Contexto atual do repositório

Colete o estado real via ferramenta de shell. Se o diretório não for um repositório git, registre como observação e siga com a leitura dos arquivos:

```bash
git branch --show-current
git status --short
git log --oneline -20
git diff --stat HEAD
```

Use como ponto de partida. Para o detalhe de qualquer mudança, leia o diff inteiro — não confie só no resumo.

## Procedimento (siga nesta ordem; pare no PORTÃO)

### 1. Localizar as fontes da verdade
Reúna, antes de auditar:
- O `CONCEITO.md` (propósito) e o `CANONICO.md` (spec técnica), se já existirem.
- O plano de ação do projeto (roadmap, arquitetura) e o **plano desta fase**, aprovado pelo líder (pode estar em doc, issue ou no histórico desta conversa).
- O relatório da fase anterior (`docs/fases/`).
Registre a ausência de qualquer um deles — a ausência é, ela própria, um achado.

### 2. Inventário do que foi feito (com prova)
Liste, arquivo por arquivo, o que mudou nesta fase: o arquivo/módulo, o que mudou e por quê. Baseie-se no diff real e na leitura do código — não na intenção declarada.

### 3. Externalizar a intenção → escrever/atualizar o CANONICO.md (incremental)
Este é o passo que faltava e que quebrava o handoff. Despeje no `docs/CANONICO.md` o conhecimento de **intenção** desta sessão (ver "As duas memórias"): a definição do sistema, os conceitos primordiais, os parâmetros, as regras travadas, os invariantes e as decisões com seus porquês e suas fontes. Escreva de forma que um estranho entenda sem a conversa. O que emergiu de novo e você não tem certeza de que o líder validou: inclua e marque *pendente de validação*.

O `CANONICO.md` é **vivo e acumulativo** — ele já vem de fechamentos anteriores, e esta auditoria cobre o trabalho feito **após** a última edição dele. Por isso, atualize com sensatez:
- Acrescente/refine apenas o **delta** que o trabalho **desta** fase legitimamente estabeleceu (um parâmetro novo, um invariante que se revelou, uma regra que se travou) — com o seu porquê e a sua fonte.
- **Não reescreva do zero** nem re-litigue invariantes já assentados sem um motivo concreto vindo do trabalho desta fase. Mexer no que já estava certo só porque você está de passagem gera um **looping infinito** de reescrita entre sessões, sem convergir. O que continua igual, deixe quieto.
- Se você achar que o `CONCEITO.md` precisa mudar para o canônico ficar consistente, **proponha** (não edite) — isso vai ao PORTÃO abaixo.

### 4. Auditoria de congruência — três eixos
Para cada ponto, classifique `CONFORME`, `DESVIO` ou `LACUNA`, com a evidência ao lado:
- **(a) Feito × Declarado** *(eixo anti-alucinação)*: confronte o que o código realmente faz com o que foi afirmado nas mensagens/commits. Aponte todo resultado declarado que não se sustenta.
- **(b) Feito × Plano aprovado**: a entrega corresponde ao que o líder aprovou? Houve desvio de escopo ou atalho não combinado?
- **(c) Feito × CANONICO/CONCEITO**: o que existe no código conforma-se à spec canônica e serve ao propósito? Onde o código contradiz o `CANONICO.md`, isso é **defeito a DOCUMENTAR** (aplicando a regra das duas verdades) — você o **registra**, não o corrige aqui (ver passo 6). Não regrida a spec para o que o código faz.

### 5. PORTÃO — validação do líder antes de reconciliar
Pare aqui. Apresente ao líder, de forma enxuta:
- O índice e os pontos centrais do `CANONICO.md` que você escreveu/atualizou nesta fase — sobretudo os invariantes e parâmetros que estavam só na conversa.
- Qualquer alteração que você **proponha** ao `CONCEITO.md`, com antes/depois.
- O plano: o que você vai **alinhar na documentação** ao canônico, e a **lista de divergências código×canônico** que vai registrar como defeitos (a corrigir depois, não agora).
Só prossiga após o "ok". Motivo: reconciliar a doc a um conceito **errado** é pior que a bagunça original — vira erro confiante e documentado. Este é o único ponto onde travar vale o atrito. (Se o líder já tiver instruído seguir direto, siga.)

### 6. Reconciliar a DOCUMENTAÇÃO ao canônico — e DOCUMENTAR (não corrigir) as divergências de código
Com o canônico validado no PORTÃO, alinhe a **documentação** a ele: deixe `HANDOFF.md`, `PENDENCIAS.md` e o índice `docs/README.md` consistentes com o canônico e entre si, e reorganize o que estiver bagunçado no diretório de docs, de forma navegável. Alinhar documentação é seguro — é registro, não mutação de comportamento.

**A auditoria NÃO mexe no código.** Onde o código contradiz o canônico validado, isso é um **defeito** — mas você o **REGISTRA**, não o corrige agora. Três razões, todas suas:
- **É uma auditoria.** O papel de uma auditoria é encontrar e registrar com evidência, não mutar o objeto auditado. Corrigir no meio confunde os dois papéis.
- **A divergência foi produzida por você.** Você acabou de fazer este trabalho; "corrigir" agora a divergência que o seu próprio trabalho criou tende a **camuflar** o defeito com confiança, em vez de resolvê-lo de verdade. Olhos frescos numa sessão posterior, com o defeito já documentado, resolvem melhor.
- **Sem teste, é regressão.** O núcleo que você alterou frequentemente não tem teste (passo 9). Reescrever código não coberto no fecho, com o contexto cheio, é a receita da regressão que este par existe para matar.

Registre cada divergência código×canônico com `arquivo:linha` no report técnico **e** como pendência em `docs/PENDENCIAS.md`, com uma frase do que precisa ser corrigido. A correção é trabalho **deliberado** de uma sessão futura (ou agora, **apenas** se o líder pedir explicitamente **e** houver teste cobrindo a mudança).

### 7. Verificação de implementação real (banco de dados, quando houver)
Não assuma; verifique. As migrações foram criadas e aplicadas? O schema reflete o que o código espera? O estado declarado está de fato persistido? Use as ferramentas do projeto (migrações, ORM, query). Sem acesso ao banco neste ambiente, marque `NÃO VERIFICADO` e diga exatamente o que um humano precisa checar. Se o projeto não usa banco, registre e siga. (Isto é verificação de leitura — não é mutação de código.)

### 8. Atualizar o prontuário e o handoff
Garanta que `HANDOFF.md`, `PENDENCIAS.md` e o índice `docs/README.md` reflitam o estado real. O `HANDOFF.md` deve permitir a entrada a frio: arquitetura atual, mapa do projeto, como rodar/testar/buildar/reverter, estado de cada módulo e como verificá-lo, armadilhas e dívidas (incluindo as divergências código×canônico registradas), e o mapa concluído × aberto. Deve descrever o **sistema inteiro acumulado**, não só o delta desta fase — quem chega a frio lê o todo.

### 9. Manter o CLAUDE.md da raiz — o guardrail que alcança TODA sessão
O `CONCEITO.md` e o `CANONICO.md` só protegem o projeto se forem lidos. A `skill-assumir-projeto-v2` os lê — mas as **sessões de trabalho comuns**, que não invocam skill nenhuma, não vão abrir o canônico por conta própria. É nessas sessões que a regressão nasce. O único arquivo carregado **automaticamente** no início de qualquer sessão é o `CLAUDE.md` da raiz; ele é, portanto, o alcance automático da doutrina.

Localize-o com a ferramenta **Glob** (`**/CLAUDE.md`, raiz). Garanta que ele contenha, de forma **enxuta**:
- Um ponteiro explícito para os normativos: *"Este projeto tem o propósito em `docs/CONCEITO.md` e a especificação técnica canônica em `docs/CANONICO.md`."*
- A regra das duas verdades em uma frase: *"O código descreve o que É; CONCEITO/CANONICO definem o que DEVE SER. Quando o código contradiz o canônico, o defeito é do código — corrija-o deliberadamente e com teste, nunca rebaixe a spec."*
- O conhecimento **não-óbvio** desta fase que evitaria um erro real (armadilhas, peculiaridades), ancorado: o que é, por que importa, onde vive no código (`arquivo:linha`).

**NÃO** entram no `CLAUDE.md`: regra de processo/diretriz, conteúdo conceitual (isso é `CONCEITO.md`), nem nada que o agente descobre só lendo o código. Se **não existir**, crie-o com esse conteúdo; se **existir**, cure-o (acrescente o novo, pode o obsoleto). Alvo: abaixo de ~200 linhas; passando disso, mova detalhe para `.claude/rules/`. Ao final, **mostre ao líder** o que adicionou e o que podou — não faça silenciosamente.

### 10. Honestidade de cobertura (não superdimensione "zero regressão")
Ao relatar testes: "sem regressão" só pode ser afirmado sobre o que **tem teste cobrindo**. Se o núcleo que você alterou não tem teste, diga isso explicitamente — "N testes existentes passam; a parte alterada X **não está coberta**, logo regressão nela não foi testada". Passar todos os testes existentes não prova ausência de regressão no que não é testado.

### 11. Versionamento (commit local → PR; nunca merge sozinho)
- Com a documentação pronta e o PORTÃO aprovado: faça o commit das mudanças (incluindo os docs e o `CLAUDE.md`) no local, suba a branch e **abra o Pull Request** com um resumo claro do que a fase entrega.
- **Trava de segurança:** NÃO execute `merge` automaticamente. Apresente o PR e pergunte ao líder, em uma linha, se ele confirma o merge. Só faça o merge após um "sim" explícito nesta conversa. (Se o líder já instruiu merge automático, siga.)

## Prova de trabalho (contra o agente preguiçoso)

Estas regras existem porque um agente pode produzir um fechamento que *parece* completo sem ter feito o trabalho. Nenhuma afirmação de conclusão vale sem a prova correspondente:

- **Razão de externalização.** Ao fechar, liste os **caminhos exatos** de todos os artefatos que gravou/atualizou. Para o `CANONICO.md`, liste **nominalmente** os invariantes e parâmetros que você capturou/refinou **nesta** sessão — não "atualizei o canônico", mas a lista real do delta. Se essa lista está vazia ou só repete o que já estava em comentários do código, você não externalizou intenção nenhuma: a intenção é justamente o que **não** está no código.
- **Prova de documentação de divergência.** Para cada contradição código×canônico que você encontrou, mostre o `arquivo:linha` onde o código diverge **e** o local (report técnico + `PENDENCIAS.md`) onde você a registrou como defeito. Você **não** corrige o código aqui (passo 6) — mas "encontrei divergências" sem a lista de `arquivo:linha` e sem o registro em `PENDENCIAS.md` é auditoria que não auditou.
- **Prova de operação git.** Não afirme "árvores idênticas", "merge-base ok" ou "sem conflito" sem **colar a saída** do comando que prova. Operação de histórico sem prova é suposição.
- **Cobertura, obrigatória.** Diga, por módulo alterado, se há teste cobrindo. "Zero regressão" sem essa linha é proibido (ver passo 10).
- **Autoteste anti-recitação.** Antes de declarar o `CANONICO.md` pronto: um estranho, lendo só este arquivo, reconstruiria os parâmetros e o porquê das decisões **sem a conversa**? Se a resposta depende de algo que só você sabe, ainda falta escrever.

## Entregáveis: dois relatórios

### A. Report técnico de fase
Para outros desenvolvedores e LLMs. Denso, com referências a arquivos/commits: inventário do que foi feito, os três eixos de congruência (com `DESVIO`/`LACUNA` em destaque), o que foi gravado/refinado no `CANONICO.md` nesta fase, a **lista das divergências código×canônico documentadas** (com `arquivo:linha`), o resultado da verificação (banco, testes com a ressalva de cobertura), e as pendências técnicas. Este report é datado e vai para `docs/fases/`, marcado como HISTÓRICO.

### B. Report executivo para o líder
**Em linguagem comum, traduzindo todo jargão.** Estruture assim:
- **Como estava:** o estado no início da fase.
- **O que foi feito:** as mudanças em termos de impacto, não de implementação.
- **Onde estamos:** o estado real e verificado agora — com franqueza sobre o que *não* ficou pronto e sobre as divergências que ficaram registradas para corrigir depois.
- **Próximos passos:** para onde o projeto vai a seguir.
- **Pendências:** o que falta do lado do desenvolvedor e do lado do líder.
- **Veredito de integridade:** uma frase dizendo se a fase pode ser fechada com segurança, ou se há risco a resolver antes.

## O teste real deste fechamento

Você **não** consegue autocertificar que o projeto "assume a frio" — você tem a conversa inteira no contexto, então tudo parece óbvio para você. O único teste honesto é uma **sessão limpa** rodando a `skill-assumir-projeto-v2` sobre os artefatos que você escreveu. Encerre deixando isso claro ao líder: "não confie no meu autoatestado; o fechamento só está validado quando uma sessão nova, a frio, ler o CONCEITO/CANONICO/HANDOFF e chegar ao mesmo entendimento." Se o handoff tiver um buraco, o briefing dessa sessão nova vai denunciá-lo logo na largada — que é onde sai barato.

## Regras de comunicação
- Traduza todo termo técnico para impacto (negócio, performance, segurança, risco) no report ao líder.
- Seja direto sobre falhas. Um achado desconfortável reportado vale mais que um relatório bonito e falso.
- Se não conseguiu verificar algo, diga "não verifiquei isto" — essa honestidade é o ponto inteiro desta auditoria.
