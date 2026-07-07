/**
 * Carga_Prontuario_Matriz_Oficial (v13 - anti-timeout)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * OBJETIVO
 *  Ao selecionar a "Conta" numa Reativação, popular o subformulário
 *  "Prontuario_de_Negocios" com os Negócios (Deals) daquela Conta,
 *  incluindo a coluna "Pessoa Relacionada" (contato de cada negócio).
 *
 * PORQUÊ DESTA VERSÃO — erro "Tempo esgotado"
 *  O Client Script do Zoho tem um limite RÍGIDO de 10 segundos de execução.
 *  O lookup "Contact_Name" aponta para outro módulo (Contatos); resolver esse
 *  lookup a cada linha é uma operação de rede. Na v12 ele era lido DUAS vezes
 *  por linha (id + nome); em ~15 negócios isso passava dos 10s -> timeout.
 *  (O "Owner" não trava porque os usuários ficam em cache no navegador.)
 *
 *  Correções:
 *   1) resolverLookup(): lê cada lookup UMA ÚNICA vez por linha e devolve
 *      { id, name } — corta pela metade a carga da coluna de contato.
 *   2) TRAVA DE TEMPO (8s): o loop encerra antes do corte de 10s do Client
 *      Script, então o script SEMPRE conclui e grava o que já montou
 *      (em vez de estourar com "Tempo esgotado").
 *
 *  Se ainda assim faltar tempo para muitos negócios, reduza LIMITE_LINHAS
 *  (ex.: 10) ou LIMITE_MS. O contato continua vindo do lookup nativo do
 *  Negócio (Contact_Name), com o ID REAL do contato.
 */

// Resolve um lookup UMA única vez e devolve { id, name }.
// Trata objeto inline ({id,name}), getter (função) ou string (só rótulo).
function resolverLookup(deal, apiName) {
    var v = deal[apiName];
    if (typeof v === 'function') {                 // getter: invoca só 1x
        try { v = deal[apiName](); } catch (e) { v = null; }
    }
    if (!v) return { id: null, name: '' };
    if (typeof v === 'string') return { id: null, name: v };
    return {
        id:   v.id || null,
        name: v.name || v.full_name || v.first_name || ''
    };
}

try {
    var INICIO        = Date.now();   // marca o início para a trava de tempo
    var LIMITE_MS     = 8000;         // encerra antes do corte de 10s do Client Script
    var LIMITE_LINHAS = 15;           // teto de negócios processados

    var contaField  = ZDK.Page.getField('Conta');
    var accountData = contaField ? contaField.getValue() : null;
    var subform     = ZDK.Page.getField('Prontuario_de_Negocios');

    if (!subform) { log('ERRO: subform ausente.'); return; }
    if (!accountData || !accountData.id) { subform.setValue([]); return; }

    var deals = ZDK.Apps.CRM.Deals.searchByCriteria('(Account_Name:equals:' + accountData.id + ')');
    if (!deals || deals.length === 0) { subform.setValue([]); log('Nenhum negocio.'); return; }

    var linhas = [];
    var limite = Math.min(deals.length, LIMITE_LINHAS);

    for (var i = 0; i < limite; i++) {

        // Trava de tempo: para antes de bater no limite de 10s e grava o que já temos.
        if (Date.now() - INICIO > LIMITE_MS) {
            log('Trava de tempo acionada na linha ' + i + ' de ' + limite);
            break;
        }

        var deal = deals[i];

        // Cada lookup é resolvido UMA única vez (id + nome reutilizados).
        var contato = resolverLookup(deal, 'Contact_Name');   // -> Contatos
        var owner   = resolverLookup(deal, 'Owner');          // -> Usuário (cache)

        linhas.push({
            'Proprietario'                : owner.name || 'Nao atribuido',
            'Montante'                    : deal.Amount ? parseFloat(deal.Amount) : 0,
            'Estagio'                     : deal.Stage || 'Sem Estagio',
            'Nro_Pedido'                  : (deal.NroPedidoUniplus    != null) ? parseInt(deal.NroPedidoUniplus, 10)    : null,
            'Nro_Nota'                    : (deal.NroNotaFiscal       != null) ? parseInt(deal.NroNotaFiscal, 10)       : null,
            'Nro_Orcamento'               : (deal.NroOrcamentoUniplus != null) ? parseInt(deal.NroOrcamentoUniplus, 10) : null,

            // Lookup nativo -> módulo Negócios (ID do próprio negócio, sempre válido).
            'Neg_cio_Relacionado'         : { 'id': deal.id, 'name': deal.Deal_Name || 'Sem Nome' },

            // Lookup nativo -> módulo Contatos (ID REAL do contato do negócio).
            'Pessoa_Relacionada_Neg_cio'  : contato.id ? { 'id': contato.id, 'name': contato.name || 'Contato' } : null
        });
    }

    subform.setValue(linhas);
    log('Subform populado: ' + linhas.length + ' em ' + (Date.now() - INICIO) + 'ms');

} catch (e) {
    log('ERRO GLOBAL: ' + e);
}
