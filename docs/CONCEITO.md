# CONCEITO.md — Propósito e Visão

> **Verdade normativa de PROPÓSITO.** Documento do líder (Roger). Não-técnico. Descreve
> **para que serve** o projeto e **para quem** — o "porquê". A especificação técnica que
> realiza este propósito vive em `CANONICO.md`. Mudanças aqui só com concordância do líder.

## Automações Zoho One — Trimaf

Este projeto é o **repositório central** das automações, scripts e integrações que a Trimaf
mantém sobre o ecossistema **Zoho One** (CRM e afins). O propósito é resolver, de forma
confiável e **reaproveitável**, necessidades operacionais recorrentes do negócio **dentro do
Zoho** — cada necessidade vira uma **automação** (um caso), e o conjunto **cresce com o
tempo**.

O valor não está em nenhuma automação isolada, e sim em ter esses fluxos **documentados,
versionados e com o conhecimento técnico preservado**, para que qualquer pessoa (ou IA)
assuma e continue o trabalho sem redescobrir as pegadinhas do Zoho a cada vez.

## Casos já existentes

1. **Rastreamento Correios** — reflete o status de entrega dos Correios dentro do negócio
   (status + histórico de rastreamento no registro do Deal).
2. **Prontuário de Negócios** — ao abrir uma **Reativação** e escolher o cliente (Conta), o
   sistema mostra automaticamente os **negócios daquele cliente**: valor, estágio, **o
   contato de cada negócio** (link direto para a pessoa) e **o próprio negócio** (link
   direto). Objetivo: dar ao time o histórico comercial do cliente na própria tela de
   reativação, sem busca manual.

Novos casos entram como **novas seções**, sobre a mesma base técnica comum (ver a Seção 0 do
`CANONICO.md`).

## Princípio de produto
As automações existem para **poupar trabalho manual e erro humano** dentro do Zoho. Uma
automação só está "pronta" quando: funciona na tela real do usuário, está documentada, e o
conhecimento de como ela funciona (e por quê) está preservado nos arquivos — não só na
cabeça de quem a construiu.
