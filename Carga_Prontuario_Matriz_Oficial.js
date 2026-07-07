/**
 * Carga_Prontuario_Matriz_Oficial (v15 - id-only + loader)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * HISTÓRICO DO PROBLEMA
 *  A API de Busca do Zoho retorna o contato do negócio COMPLETO:
 *      "Contact_Name": { "name": "Alexandro -", "id": "6482411000001041987" }
 *  Porém, no Client Script, o ZDK entrega um registro "leve": o .id do
 *  lookup vem (válido), mas o .name NÃO vem preenchido — por isso a coluna
 *  mostrava o texto de fallback "Contato". (E tocar nesse lookup é o que
 *  gerava a latência do timeout de 10s, hoje contornado pelo loader.)
 *
 * CORREÇÃO
 *  Não depender do .name. Passamos apenas { id } do contato (que é válido) e
 *  o próprio Zoho resolve/exibe o nome real do contato na coluna. Se o .name
 *  vier disponível, ele é usado como dica; senão, é omitido de propósito.
 *
 *  A coluna "Pessoa Relacionada" continua (corretamente) sendo um lookup para
 *  CONTATOS — ela guarda uma PESSOA; o negócio é só a origem que diz QUAL.
 *
 *  Loader (Kaizen #139): mantém a execução suspensa e evita o timeout de 10s.
 *
 *  DIAGNÓSTICO: a 1ª linha registra no log o formato bruto de Contact_Name.
 *  Se o nome ainda não aparecer, veja esse log e me envie — dá para finalizar
 *  (ou migrar a resolução do contato para uma função Deluge server-side).
 */

// Resolve um lookup UMA única vez e devolve { id, name }.
function resolverLookup(deal, apiName) {
    var v = deal[apiName];
    if (typeof v === 'function') {                 // getter: invoca só 1x
        try { v = deal[apiName](); } catch (e) { v = null; }
    }
    if (!v) return { id: null, name: '' };
    if (typeof v === 'string') return { id: null, name: v };
    return {
        id:   v.id || null,
        name: v.name || v.full_name || v.first_name || v.display_value || ''
    };
}

// Ativa o loader ANTES do processamento -> suspende o timeout de 10s.
ZDK.Client.showLoader({ type: 'page', template: 'spinner', message: 'Carregando negócios da conta...' });

try {
    var LIMITE_LINHAS = 15;

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

        // --- Diagnóstico (só na 1ª linha): mostra o formato real do lookup ---
        if (i === 0) {
            try { log('DEBUG Contact_Name = ' + JSON.stringify(deal.Contact_Name)); }
            catch (e) { log('DEBUG Contact_Name typeof = ' + (typeof deal.Contact_Name)); }
        }

        var contato = resolverLookup(deal, 'Contact_Name');   // -> Contatos
        var owner   = resolverLookup(deal, 'Owner');          // -> Usuário (cache)

        // Monta a Pessoa Relacionada com o ID válido; o Zoho resolve o nome.
        var pessoa = null;
        if (contato.id) {
            pessoa = { 'id': contato.id };
            if (contato.name) { pessoa.name = contato.name; }   // nome só como dica, se existir
        }

        linhas.push({
            'Proprietario'                : owner.name || 'Nao atribuido',
            'Montante'                    : deal.Amount ? parseFloat(deal.Amount) : 0,
            'Estagio'                     : deal.Stage || 'Sem Estagio',
            'Nro_Pedido'                  : (deal.NroPedidoUniplus    != null) ? parseInt(deal.NroPedidoUniplus, 10)    : null,
            'Nro_Nota'                    : (deal.NroNotaFiscal       != null) ? parseInt(deal.NroNotaFiscal, 10)       : null,
            'Nro_Orcamento'               : (deal.NroOrcamentoUniplus != null) ? parseInt(deal.NroOrcamentoUniplus, 10) : null,

            // Lookup nativo -> módulo Negócios (ID do próprio negócio, sempre válido).
            'Neg_cio_Relacionado'         : { 'id': deal.id, 'name': deal.Deal_Name || 'Sem Nome' },

            // Lookup nativo -> módulo Contatos (só ID; Zoho resolve o nome real).
            'Pessoa_Relacionada_Neg_cio'  : pessoa
        });
    }

    subform.setValue(linhas);
    log('Subform populado: ' + linhas.length);

} catch (e) {
    log('ERRO GLOBAL: ' + e);
} finally {
    ZDK.Client.hideLoader();   // sempre encerra o loader
}
