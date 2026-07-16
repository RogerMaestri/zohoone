/**
 * Carga_Prontuario_Matriz_Oficial (v17 - leitura do retorno corrigida)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * FLUXO
 *  1. Pega a Conta selecionada.
 *  2. Chama a função Deluge "carga_prontuario_negocios" (roda no servidor e
 *     devolve as 15 linhas prontas, JÁ com o contato correto).
 *  3. Interpreta o retorno e popula o subformulário.
 *
 * DETALHES DO RETORNO (comprovados pelo log real)
 *  - O execute() devolve um OBJETO. O texto JSON fica em: resp._details.output
 *  - A função monta os objetos separados por vírgula, SEM os colchetes [ ];
 *    por isso envolvemos o texto com [ ] antes de fazer JSON.parse.
 */

// Loader: suspende o timeout de 10s enquanto a função roda.
ZDK.Client.showLoader({ type: 'page', template: 'spinner', message: 'Carregando negócios da conta...' });

try {
    var contaField  = ZDK.Page.getField('Conta');
    var accountData = contaField ? contaField.getValue() : null;
    var subform     = ZDK.Page.getField('Prontuario_de_Negocios');

    if (!subform) { log('ERRO: subform ausente.'); return; }
    if (!accountData || !accountData.id) { subform.setValue([]); return; }

    // Resolve tudo no servidor (inclui o contato). Retorna as linhas em JSON.
    var resp = ZDK.Apps.CRM.Functions.execute('carga_prontuario_negocios', { 'accountId': accountData.id });

    // O JSON vem dentro do envelope: resp._details.output (texto).
    var texto = '';
    if (resp && resp._details && resp._details.output != null) {
        texto = '' + resp._details.output;
    } else if (typeof resp === 'string') {
        texto = resp;
    } else if (resp && resp.details && resp.details.output != null) {
        texto = '' + resp.details.output;
    }
    texto = texto.trim();

    // A função devolve os objetos sem os colchetes -> garante um array JSON válido.
    if (texto.length > 0 && texto.charAt(0) !== '[') {
        texto = '[' + texto + ']';
    }

    var linhas = [];
    try {
        linhas = texto ? JSON.parse(texto) : [];
    } catch (e) {
        log('Falha ao interpretar retorno: ' + e);
        linhas = [];
    }
    if (!linhas || typeof linhas.length !== 'number') { linhas = []; }

    subform.setValue(linhas);
    log('Subform populado: ' + linhas.length);

} catch (e) {
    log('ERRO GLOBAL: ' + e);
} finally {
    ZDK.Client.hideLoader();   // sempre encerra o loader
}
