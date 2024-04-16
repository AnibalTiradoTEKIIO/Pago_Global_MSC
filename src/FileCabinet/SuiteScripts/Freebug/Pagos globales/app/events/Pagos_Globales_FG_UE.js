/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], (record) => {

    const beforeLoad = (scriptContext) => {
        try {

            if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
                return;
            }

            scriptContext.form.addButton({
                id: 'custpage_pago_global', label: 'Pagar', functionName: 'pagoGlobal(' + scriptContext.newRecord.id + ');'
            });

            scriptContext.form.clientScriptModulePath = 'SuiteScripts/Freebug/Pagos globales/app/uievents/Pagos_Globales_FG_CS.js';

        } catch (error) {
            log.debug('beforeLoad : error:', error);
        }
    }

    return { beforeLoad }

});
