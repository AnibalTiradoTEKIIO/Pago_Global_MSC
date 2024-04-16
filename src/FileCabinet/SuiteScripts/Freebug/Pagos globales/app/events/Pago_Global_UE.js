/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js'],
    (runtime, configModule) => {

        let CONFIG;

        const init = () => {
            try {

                CONFIG = configModule.getConfiguration();
                CONFIG.setup();

                log.audit('init : Configuration', CONFIG);

            } catch (error) {
                throw error;
            }
        }

        const beforeLoad = (scriptContext) => {
            try {

                if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
                    return;
                }

                init();

                if (CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR == scriptContext.newRecord.getValue({ fieldId: CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id })) {

                    scriptContext.form.addButton({
                        id: 'custpage_reprocess', label: 'Reprocesar', functionName: 'reprocess(' + scriptContext.newRecord.id + ');'
                    });
                }

                scriptContext.form.clientScriptModulePath = 'SuiteScripts/Freebug/Pagos globales/app/uievents/Pago_Global_CS.js';

            } catch (error) {
                log.error('beforeLoad : error:', error);
            }
        }

        return { beforeLoad }

    });
