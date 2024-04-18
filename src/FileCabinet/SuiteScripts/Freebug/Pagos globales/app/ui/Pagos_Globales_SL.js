/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/https', 'N/ui/serverWidget', 'N/format', 'N/task', 'N/redirect', 'N/search', './config.js', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js',
    'SuiteScripts/Freebug/Pagos globales/lib/enum/classes.js', 'SuiteScripts/Freebug/Pagos globales/lib/enum/common.js'],

    (record, https, serverWidget, format, task, redirect, search, uiConfig, configModule, classes, common) => {

        let REQ, SCRIPT_PARAMETERS, GLB_FORM;

        let CONFIG = configModule.getConfiguration();
        let UI_CONFIG = uiConfig.getConfiguration();

        CONFIG.setup();
        UI_CONFIG.setup();

        let TEXTS = {
            BTN_SUBMIT: 'Procesar',
            ERROR_REPROCESSING_PAGO_GLOBAL: 'Ocurrió un error al tratar de reprocesar el Pago global',
            ERROR_CREATING_PAGO_GLOBAL: 'Ocurrió un error al inicializar el Pago global',
            ERROR_PROCESSING_PAGO_GLOBAL: 'Ocurrió un error al iniciar el proceso del Pago global'
        };

        /**
         * Parámetros del script
         */
        const loadScriptParameters = () => {
            SCRIPT_PARAMETERS = {};

            Object.values(CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.parameters).forEach(param => {

                /* Verifica el tipo de un parámetro y asigna un valor al objeto `SCRIPT_PARAMETERS` según el tipo. */
                switch (param.type) {
                    case 'TEXT':
                        SCRIPT_PARAMETERS[param.alias] = REQ.parameters[param.id] || ''
                        break;
                    case 'CHECK':
                        SCRIPT_PARAMETERS[param.alias] = (REQ.parameters[param.id] && 'true' == REQ.parameters[param.id]) || false;
                        break;
                    case 'SELECT':
                        SCRIPT_PARAMETERS[param.alias] = Number(REQ.parameters[param.id]) || ''
                        break;
                }
            });

            log.audit({ title: 'Script parameters', details: SCRIPT_PARAMETERS });
        }

        const init = () => {
            try {

                log.audit('init : Configuration', CONFIG);
                log.audit('init : UI configuration:', UI_CONFIG);

                loadScriptParameters();

            } catch (error) {
                throw error;
            }
        }

        const goToReport = () => {
            redirect.toSavedSearchResult({
                id: CONFIG.SAVED_SEARCHS.PROCESO_PAGOS_GLOBALES.id
            });
        }

        const get = () => {
            try {

                log.audit('get : REQ:', REQ);

                if (SCRIPT_PARAMETERS.reprocesarPagoGlobal && SCRIPT_PARAMETERS.pagoGlobal) {

                    if (!executePagoGlobal({ pagoGlobalId: SCRIPT_PARAMETERS.pagoGlobal })) {

                        GLB_FORM.getField({ id: 'custpage_fld_errors' }).defaultValue = TEXTS.ERROR_REPROCESSING_PAGO_GLOBAL;
                        return;
                    }

                    goToReport();
                }

            } catch (error) {
                log.error('get : error:', error);
            }
        }

        const createPagoGlobal = ({ facturaConsolidadaId, clienteId, fecha, cuentaId, monedaId, metodoPagoId, formaPagoId, usoCfdiId,
            invoicesId, prorrateoPago }) => {

            log.audit('createPagoGlobal :', {
                facturaConsolidadaId, clienteId, fecha, cuentaId, monedaId, metodoPagoId, formaPagoId, usoCfdiId, invoicesId, prorrateoPago
            });

            try {

                let { FIELDS } = CONFIG.RECORDS.PAGO_GLOBAL;

                let pagoGlobal = record.create({
                    type: CONFIG.RECORDS.PAGO_GLOBAL.id, isDynamic: false
                });

                pagoGlobal.setValue({ fieldId: FIELDS.STATUS.id, value: CONFIG.LISTS.ESTATUS_PROCESO.values.PENDIENTE });
                pagoGlobal.setValue({ fieldId: FIELDS.FACTURA_CONSOLIDADA.id, value: facturaConsolidadaId });
                pagoGlobal.setValue({ fieldId: FIELDS.CLIENTE.id, value: clienteId });
                pagoGlobal.setValue({ fieldId: FIELDS.FECHA.id, value: format.parse({ value: fecha, type: format.Type.DATE }) });
                pagoGlobal.setValue({ fieldId: FIELDS.CUENTA.id, value: cuentaId });
                pagoGlobal.setValue({ fieldId: FIELDS.MONEDA.id, value: monedaId });
                pagoGlobal.setValue({ fieldId: FIELDS.METODO_PAGO.id, value: metodoPagoId });
                pagoGlobal.setValue({ fieldId: FIELDS.FORMA_PAGO.id, value: formaPagoId });
                pagoGlobal.setValue({ fieldId: FIELDS.USO_CFDI.id, value: usoCfdiId });
                pagoGlobal.setValue({ fieldId: FIELDS.FACTURAS.id, value: invoicesId });
                pagoGlobal.setValue({ fieldId: FIELDS.PRORRATEO_PAGO.id, value: JSON.stringify(prorrateoPago) });

                return pagoGlobal.save({ ignoreMandatoryFields: true });
            } catch (error) {
                log.debug('createPagoGlobal : error:', error);
            }
        }

        // const executePagoGlobal = ({ pagoGlobalId,facturaConsolidadaId }) => { //ANIBAL
        const executePagoGlobal = ({ pagoGlobalId}) => {
            try {
                log.audit('executePagoGlobal : pagoGlobalId:', pagoGlobalId);

                if (!pagoGlobalId)
                    return;

                let params = {}, taskExecutionId = '';
                params[CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.parameters.PAGO_GLOBAL.id] = pagoGlobalId;
               // params[CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.parameters.FACTURA_CONSOLIDADA.id] = facturaConsolidadaId;


                for (let deploymentIndex = 0; deploymentIndex < CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.deployments.length; deploymentIndex++) {

                    log.audit('executePagoGlobal :', 'Ejecución de la implementación ' + CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.deployments[deploymentIndex]);

                    try {
                        taskExecutionId = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.id,
                            deploymentId: CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.deployments[0],
                            params: params
                        }).submit();

                        if (taskExecutionId) {
                            break;
                        }
                    } catch (e) {
                        log.error('executePagoGlobal :', 'La implementación ' + CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.deployments[deploymentIndex] + ' se encuentra en ejecución');
                    }
                }

                return taskExecutionId;

            } catch (error) {
                throw error;
            }
        }

        const post = () => {
            try {

                log.audit('get : REQ:', REQ);
                log.debug('post : REQ.parameters:', REQ.parameters);

                let { BODY_FIELDS } = UI_CONFIG.FORMS.PAGOS_GLOBALES;
                let { LINE_FIELDS } = UI_CONFIG.FORMS.PAGOS_GLOBALES;

                if (!REQ.parameters[BODY_FIELDS.FACTURA_CONSOLIDADA.id]) {
                    return;
                }

                const SUBLIST_VALUES = common.getSublistValues({
                    recordObjType: common.constants().OBJECT_TYPE_REQUEST,
                    sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                    sublistColumns: [LINE_FIELDS.INTERNALID, LINE_FIELDS.TRAN_ID, LINE_FIELDS.TOTAL_PAYMENT],
                    recordObj: REQ
                });

                log.audit('post : SUBLIST_VALUES:', SUBLIST_VALUES);

                const PAGO_GLOBAL_ID = createPagoGlobal({
                    facturaConsolidadaId: REQ.parameters[BODY_FIELDS.FACTURA_CONSOLIDADA.id],
                    clienteId: REQ.parameters[BODY_FIELDS.CLIENTE.id],
                    cuentaId: REQ.parameters[BODY_FIELDS.CUENTA.id],
                    monedaId: REQ.parameters[BODY_FIELDS.MONEDA.id],
                    fecha: REQ.parameters[BODY_FIELDS.FECHA_PAGO.id],
                    metodoPagoId: REQ.parameters[BODY_FIELDS.METODO_PAGO.id],
                    formaPagoId: REQ.parameters[BODY_FIELDS.FORMA_PAGO.id],
                    usoCfdiId: REQ.parameters[BODY_FIELDS.USO_CFDI.id],
                    invoicesId: SUBLIST_VALUES.map(row => row.custpage_column_invc_internalid),
                    prorrateoPago: SUBLIST_VALUES
                });

                log.audit('post : PAGO_GLOBAL_ID:', PAGO_GLOBAL_ID);

                if (!PAGO_GLOBAL_ID) {
                    GLB_FORM.getField({ id: 'custpage_fld_errors' }).defaultValue = TEXTS.ERROR_CREATING_PAGO_GLOBAL;
                    return;
                }

                // if (!executePagoGlobal({ pagoGlobalId: PAGO_GLOBAL_ID,facturaConsolidadaId: REQ.parameters[BODY_FIELDS.FACTURA_CONSOLIDADA.id]})) { //ANIBAL
                if (!executePagoGlobal({ pagoGlobalId: PAGO_GLOBAL_ID})) {
                    GLB_FORM.getField({ id: 'custpage_fld_errors' }).defaultValue = TEXTS.ERROR_PROCESSING_PAGO_GLOBAL;
                    return;
                }

                redirect.toSavedSearchResult({
                    id: CONFIG.SAVED_SEARCHS.PROCESO_PAGOS_GLOBALES.id
                });

                goToReport();

            } catch (error) {
                log.error('post : error:', error);
            }
        }

        const buildSublist = () => {
            try {

                const { PAGOS_GLOBALES } = UI_CONFIG.FORMS;
                const { LINE_FIELDS } = PAGOS_GLOBALES;

                GLB_FORM.addTab({ id: 'custpage_main', label: 'Facturas' });

                let invoiceSublist = GLB_FORM.addSublist({
                    id: 'custpage_sublist_invoices', label: 'Facturas',
                    tab: 'custpage_tab_matrix_options', type: serverWidget.SublistType.INLINEEDITOR
                });

                /* Columnas */

                invoiceSublist.addField(LINE_FIELDS.INTERNALID)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                invoiceSublist.addField(LINE_FIELDS.TRAN_ID)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                invoiceSublist.addField(LINE_FIELDS.TRAN_DATE)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                invoiceSublist.addField(LINE_FIELDS.CURRENCY)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                invoiceSublist.addField(LINE_FIELDS.TOTAL)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                invoiceSublist.addField(LINE_FIELDS.DUE_AMOUNT)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                invoiceSublist.addField(LINE_FIELDS.TOTAL_PAYMENT)
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED })
                    .defaultValue = 0.00;

            } catch (error) {
                log.error({ title: 'buildSublist', details: error });
            }
        }

        const isFacturaGlobalValid = () => {
            try {

                const FACTURA_GLOBAL_RECORD = record.load({ type: CONFIG.TRANSACTIONS.FACTURA_GLOBAL.id, id: SCRIPT_PARAMETERS.facturaConsolidada });

                const { TRANSACTION_BODY } = CONFIG.FIELDS;

                const FACTURA_GLOBAL = classes.facturaGlobal(Object.fromEntries([TRANSACTION_BODY.INTERNALID,
                TRANSACTION_BODY.TRANSACCIONES_GLB].map(field => [field.alias, common.getValuesFromObject({
                    objectType: common.constants().OBJECT_TYPE_RECORD,
                    fieldType: field.type,
                    fieldId: field.id,
                    object: FACTURA_GLOBAL_RECORD
                })])));

                if (0 === FACTURA_GLOBAL._transaccionesGlb.value.length) {
                    return;
                }

                return (0 < search.create({
                    type: search.Type.INVOICE,
                    filters: [
                        ['mainline', search.Operator.IS, 'T'], 'AND',
                        [TRANSACTION_BODY.INTERNALID.id, search.Operator.ANYOF, FACTURA_GLOBAL._transaccionesGlb.value], 'AND',
                        [TRANSACTION_BODY.AMOUNT_REMAINING.id, search.Operator.GREATERTHAN, '0.00'], 'AND',
                        [TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF.id, search.Operator.NONEOF, '@NONE@'], 'AND',
                        [TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC.id, search.Operator.NONEOF, '@NONE@']
                    ],
                    columns: [search.createColumn({ name: 'datecreated', sort: search.Sort.ASC })]
                }).run().getRange({ start: 0, end: 1 }).length);

            } catch (error) {
                log.debug('isFacturaGlobalValid : error:', error);
            }
        }

        /**-
         * Construcción del formulario
         * @param requestMethod - El método HTTP utilizado para acceder al Suitelet.
         */
        const buildForm = ({ requestMethod }) => {
            try {

                const { PAGOS_GLOBALES } = UI_CONFIG.FORMS;
                const { BODY_FIELDS } = PAGOS_GLOBALES;

                GLB_FORM = serverWidget.createForm({ title: PAGOS_GLOBALES.title });

                /** Grupos de campos */

                GLB_FORM.addFieldGroup(PAGOS_GLOBALES.FIELD_GROUPS.MAIN);
                GLB_FORM.addFieldGroup(PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT);

                mainGroup: {

                    if (SCRIPT_PARAMETERS.reprocesarPagoGlobal) {
                        break mainGroup;
                    }
                    /** Campos */

                    let fldFacturaConsolidada = GLB_FORM.addField({ ...BODY_FIELDS.FACTURA_CONSOLIDADA, source: CONFIG.TRANSACTIONS.FACTURA_GLOBAL.id });
                    log.debug('buildForm : fldFacturaConsolidada:', fldFacturaConsolidada);

                    fldFacturaConsolidada.isMandatory = true;

                    if (!SCRIPT_PARAMETERS.facturaConsolidada) {
                        break mainGroup;
                    }

                    fldFacturaConsolidada.defaultValue = SCRIPT_PARAMETERS.facturaConsolidada;

                    if (!isFacturaGlobalValid()) {
                        break mainGroup;
                    }

                    GLB_FORM.addField(BODY_FIELDS.CLIENTE)
                        .isMandatory = true;

                    GLB_FORM.addField({ ...BODY_FIELDS.MONEDA })
                        .isMandatory = true;

                    let fldImportePagar = GLB_FORM.addField(BODY_FIELDS.IMPORTE_PAGAR)
                        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED })
                        .defaultValue = 0.00;

                    fldImportePagar.isMandatory = true;

                    GLB_FORM.addField(BODY_FIELDS.IMPORTE_TOTAL_ADEUDADO)
                        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })
                        .defaultValue = 0.00;

                    GLB_FORM.addField(BODY_FIELDS.IMPORTE_TOTAL_APLICAR)
                        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })
                        .defaultValue = 0.00;

                    GLB_FORM.addField(BODY_FIELDS.PARCIALIDAD)
                        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED })
                        .defaultValue = 1;

                    // GLB_FORM.addField({ ...BODY_FIELDS.METODO_PAGO, source: 'paymentmethod' })
                    //     .isMandatory = true;

                    GLB_FORM.addField({ ...BODY_FIELDS.FORMA_PAGO, source: 'customrecord_efx_fe_formapago' })
                        .isMandatory = true;

                    GLB_FORM.addField({ ...BODY_FIELDS.USO_CFDI, source: 'customrecord_mx_sat_cfdi_usage' })
                        .isMandatory = true;

                    GLB_FORM.addField({ ...BODY_FIELDS.CUENTA, source: 'account' })
                        .isMandatory = true;

                    GLB_FORM.addField(BODY_FIELDS.FECHA_PAGO)
                        .defaultValue = format.parse({
                            value: new Date(), type: format.Type.DATE
                        });

                    switch (requestMethod) {
                        case https.Method.GET:

                            if (SCRIPT_PARAMETERS.facturaConsolidada) {

                                buildSublist();
                                GLB_FORM.addSubmitButton({ label: TEXTS.BTN_SUBMIT });
                            }

                            break;
                    }
                }

                GLB_FORM.addField({ id: 'custpage_fld_errors', type: serverWidget.FieldType.LONGTEXT, label: 'Errores' })
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                GLB_FORM.addField({ id: 'custpage_fld_warnings', type: serverWidget.FieldType.LONGTEXT, label: 'Alertas' })
                    .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            } catch (error) {
                log.error({ title: 'buildForm', details: error });
            }
        }

        const onRequest = (scriptContext) => {
            try {

                REQ = scriptContext.request;

                init();

                buildForm({ requestMethod: https.Method.GET });

                switch (REQ.method) {
                    case https.Method.GET:
                        get();
                        break;
                    case https.Method.POST:
                        post();
                        break;
                }

                GLB_FORM.clientScriptModulePath = '../uievents/Pagos_Globales_CS.js';
                scriptContext.response.writePage(GLB_FORM);

            } catch (error) {
                log.error('onRequest : error:', error);
                throw error;
            }
        }

        return { onRequest }
    });