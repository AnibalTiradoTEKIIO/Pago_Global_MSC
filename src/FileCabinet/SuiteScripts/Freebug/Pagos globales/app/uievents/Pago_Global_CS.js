/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js'],

    function (url, record, configModule) {

        let CONFIG = configModule.getConfiguration();

        CONFIG.setupObjets();
        CONFIG.setupScripts();

        function pageInit() {
            return true;
        }

        function reprocess(pagoGlobalRecordId) {
            try {

                record.submitFields({
                    type: CONFIG.RECORDS.PAGO_GLOBAL.id,
                    id: pagoGlobalRecordId,
                    values: Object.fromEntries([[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id, CONFIG.LISTS.ESTATUS_PROCESO.values.PENDIENTE]])
                });

                window.open(url.resolveScript({
                    scriptId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.id,
                    deploymentId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.deployments[0],
                    params: Object.fromEntries([
                        [CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.parameters.REPROCESAR_PAGO_GLOBAL.id, true],
                        [CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.parameters.PAGO_GLOBAL.id, pagoGlobalRecordId]
                    ])
                }), '_self');

            } catch (error) {
                console.log(error);
            }

            return true;
        }

        return {
            pageInit, reprocess
        };

    });
