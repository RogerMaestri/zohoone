/**
 * Carga_Prontuario_Matriz_Oficial (v14 - loader anti-timeout)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * OBJETIVO
 *  Ao selecionar a "Conta" numa Reativação, popular o subformulário
 *  "Prontuario_de_Negocios" com os Negócios (Deals) daquela Conta,
 *  incluindo a coluna "Pessoa Relacionada" (contato de cada negócio).
 *
 * SOBRE O ERRO "Tempo esgotado"
 *  O Client Script tem limite RÍGIDO de 10s. As demais colunas vêm dos
 *  campos próprios do negócio (embutidos na busca leve) e são instantâneas.
 *  Já o lookup "Contact_Name" (módulo Contatos) NÃO vem embutido na busca
 *  leve: para cada negócio o ZDK faz uma ida ao servidor só para resolver o
 *  contato. Com vários negócios, isso passa dos 10s.
 *
 *  IMPORTANTE: a coluna "Pessoa Relacionada" DEVE ser lookup para Contatos
 *  (ela guarda uma PESSOA). O negócio é só a origem que informa QUAL contato.
 *  Trocar o campo para lookup de Deals não resolveria o timeout e apontaria
 *  para um negócio em vez de uma pessoa (duplicando "Negócio Relacionado").
 *
 *  SOLUÇÃO (oficial do Zoho - Kaizen #139): enquanto um loader estiver ativo,
 *  a execução fica suspensa e o timeout de 10s NÃO ocorre. Por isso toda a
 *  lógica roda entre ZDK.Client.showLoader() e hideLoader() (o hideLoader é
 *  chamado no 'finally', então o loader nunca fica preso mesmo com erro).
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

// Ativa o loader ANTES do processamento -> suspende o timeout de 10s.
ZDK.Client.showLoader({ type: 'page', template: 'spinner', message: 'Carregando negócios da conta...' });

try {
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
        var deal = deals[i];

        // Cada lookup é resolvido UMA única vez (id + nome reutilizados).
        var contato = resolverLookup(deal, 'Contact_Name');   // -> Contatos (ida ao servidor)
        var owner   = resolverLookup(deal, 'Owner');          // -> Usuário (cache, rápido)

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
    log('Subform populado: ' + linhas.length);

} catch (e) {
    log('ERRO GLOBAL: ' + e);
} finally {
    // Sempre encerra o loader (mesmo em erro ou return antecipado).
    ZDK.Client.hideLoader();
}
