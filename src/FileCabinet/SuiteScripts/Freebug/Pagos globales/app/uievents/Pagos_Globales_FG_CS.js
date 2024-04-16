/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js'],

    function (url, configModule) {

        let CONFIG = configModule.getConfiguration();

        CONFIG.setupScripts();

        function pageInit(scriptContext) {
            return true;
        }

        function pagoGlobal(facturaConsolidadaId) {
            try {

                window.open(url.resolveScript({
                    scriptId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.id,
                    deploymentId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.deployments[0], returnExternalUrl: false,
                    params: Object.fromEntries([[CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.parameters.FACTURA_CONSOLIDADA.id, facturaConsolidadaId]])
                }), '_blank');

            } catch (error) {
                console.log(error);
            }

            return true;
        }

        return {
            pageInit, pagoGlobal
        };

    });
