/**
 * Carga_Prontuario_Matriz_Oficial (v16 - servidor via função Deluge)
 * Ferramenta: ZOHO CRM  |  Tipo: Script de Cliente (Client Script)
 * Módulo: Reativacoes  |  Campo: Conta  |  Evento: Field onChange
 *
 * POR QUE MUDOU
 *  Ficou comprovado que a busca do ZDK no navegador NÃO devolve o campo
 *  Contact_Name (vem "undefined") e ainda carrega TODOS os negócios da conta
 *  (ex.: 101), beirando o limite de 10s. Nenhum ajuste no Client Script
 *  resolveria porque o dado do contato simplesmente não chega ao navegador.
 *
 *  Agora TODO o trabalho pesado é feito no servidor pela função Deluge
 *  "carga_prontuario_negocios", que retorna as linhas prontas (com o contato
 *  correto). Este Client Script só chama a função e joga no subformulário.
 *
 * PRÉ-REQUISITO
 *  Criar a função standalone "carga_prontuario_negocios" (ver arquivo
 *  carga_prontuario_negocios.deluge). Argumento: accountId (String).
 */

// Loader: mantém a execução suspensa (sem timeout) enquanto a função roda.
ZDK.Client.showLoader({ type: 'page', template: 'spinner', message: 'Carregando negócios da conta...' });

try {
    var contaField  = ZDK.Page.getField('Conta');
    var accountData = contaField ? contaField.getValue() : null;
    var subform     = ZDK.Page.getField('Prontuario_de_Negocios');

    if (!subform) { log('ERRO: subform ausente.'); return; }
    if (!accountData || !accountData.id) { subform.setValue([]); return; }

    // Resolve tudo no servidor (inclui o contato). Retorna JSON com as linhas.
    var resp = ZDK.Apps.CRM.Functions.execute('carga_prontuario_negocios', { 'accountId': accountData.id });

    // Diagnóstico: formato exato do retorno (ajuda a ajustar se necessário).
    try { log('DEBUG resp = ' + JSON.stringify(resp)); } catch (e) { log('DEBUG resp typeof = ' + (typeof resp)); }

    // Extrai o texto JSON, tratando os formatos possíveis de retorno do execute().
    var texto = resp;
    if (resp && typeof resp === 'object') {
        texto = resp.output || resp.result || resp.response ||
                (resp.details ? (resp.details.output || resp.details) : null) || resp;
        if (texto && typeof texto === 'object') { texto = texto.output || JSON.stringify(texto); }
    }

    var linhas = [];
    try {
        linhas = (typeof texto === 'string') ? JSON.parse(texto) : texto;
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
