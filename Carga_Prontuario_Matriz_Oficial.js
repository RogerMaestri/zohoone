/**
 * Carga_Prontuario_Matriz_Oficial (v12 - final)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * OBJETIVO
 *  Ao selecionar a "Conta" numa Reativação, popular o subformulário
 *  "Prontuario_de_Negocios" com os Negócios (Deals) daquela Conta.
 *
 * CORREÇÃO DESTA VERSÃO — coluna "Pessoa Relacionada" (Pessoa_Relacionada_Neg_cio)
 *  Causa raiz (v11): o ID do contato era lido de `deal.Contact_Name_Lookup_Id`,
 *  propriedade que NÃO existe no objeto do Negócio. Sem um ID válido, o lookup ficava
 *  "não selecionado": o campo aparecia vazio e, ao clicar, abria a lista completa de
 *  contatos para escolha manual (o que parecia um "problema de filtragem").
 *
 *  Diagnóstico confirmado nos metadados/registros reais do CRM:
 *   - No módulo Negócios (Deals) o contato fica no lookup NATIVO `Contact_Name`,
 *     cujo valor é um objeto { id, name } (ex.: {"name":"Alexandro -","id":"64824...987"}).
 *   - O ID correto do contato está em `deal.Contact_Name.id`
 *     e o rótulo em `deal.Contact_Name.name`.
 *   - A coluna "Negócio Relacionado" sempre funcionou porque usa `deal.id`
 *     (ID sempre válido). Agora a "Pessoa Relacionada" segue o mesmo padrão,
 *     usando o ID REAL do contato — não é preciso nenhum filtro no lookup.
 *
 *  Sem fetchById (aborta execução no Client Script) e sem Deluge.
 */

// Resolve o valor bruto de um lookup, tratando getters (função), quando aplicável.
function lookupRaw(deal, apiName) {
    var v = deal[apiName];
    if (typeof v === 'function') { try { v = deal[apiName](); } catch (e) { v = null; } }
    return v;
}

// Extrai o ID de um lookup (Contact_Name, Account_Name, ...), qualquer que seja o formato.
function lookupId(deal, apiName) {
    var v = lookupRaw(deal, apiName);
    if (!v) return null;
    if (typeof v === 'object') return v.id || null;
    return null;
}

// Extrai o rótulo textual de um lookup, disponível como string ou objeto.
function lookupName(deal, apiName) {
    var v = lookupRaw(deal, apiName);
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v.full_name || v.name || v.first_name || '';
}

try {
    var contaField  = ZDK.Page.getField('Conta');
    var accountData = contaField ? contaField.getValue() : null;
    var subform     = ZDK.Page.getField('Prontuario_de_Negocios');

    if (!subform) { log('ERRO: subform ausente.'); return; }
    if (!accountData || !accountData.id) { subform.setValue([]); return; }

    var deals = ZDK.Apps.CRM.Deals.searchByCriteria('(Account_Name:equals:' + accountData.id + ')');
    if (!deals || deals.length === 0) { subform.setValue([]); log('Nenhum negocio.'); return; }

    var linhas = [];
    var limite = Math.min(deals.length, 15);

    for (var i = 0; i < limite; i++) {
        var deal = deals[i];

        // ID e nome do contato do próprio Negócio (lookup nativo Contact_Name -> Contatos).
        var contatoId   = lookupId(deal, 'Contact_Name');
        var contatoNome = lookupName(deal, 'Contact_Name') || 'Contato';

        linhas.push({
            'Proprietario'                : lookupName(deal, 'Owner') || 'Nao atribuido',
            'Montante'                    : deal.Amount ? parseFloat(deal.Amount) : 0,
            'Estagio'                     : deal.Stage || 'Sem Estagio',
            'Nro_Pedido'                  : (deal.NroPedidoUniplus    != null) ? parseInt(deal.NroPedidoUniplus, 10)    : null,
            'Nro_Nota'                    : (deal.NroNotaFiscal       != null) ? parseInt(deal.NroNotaFiscal, 10)       : null,
            'Nro_Orcamento'               : (deal.NroOrcamentoUniplus != null) ? parseInt(deal.NroOrcamentoUniplus, 10) : null,

            // Lookup nativo -> módulo Negócios (ID do próprio negócio, sempre válido).
            'Neg_cio_Relacionado'         : { 'id': deal.id, 'name': deal.Deal_Name || 'Sem Nome' },

            // Lookup nativo -> módulo Contatos (ID REAL do contato do negócio).
            'Pessoa_Relacionada_Neg_cio'  : contatoId ? { 'id': contatoId, 'name': contatoNome } : null
        });
    }

    subform.setValue(linhas);
    log('Subform populado: ' + linhas.length);

} catch (e) {
    log('ERRO GLOBAL: ' + e);
}
