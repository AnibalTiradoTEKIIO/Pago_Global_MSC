/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/format', 'N/url', 'N/https', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js', 'SuiteScripts/Freebug/Pagos globales/lib/enum/common.js',
    'SuiteScripts/Freebug/Pagos globales/lib/enum/classes.js'],

    (record, search, runtime, format, url, https, configModule, common, classes) => {

        let CONFIG, CONFIG_RECORD, SCRIPT_PARAMETERS;

        let pagoGlobalUpdates = {};

        const STAGES = {
            GET_INPUT_DATA: 'mapreduce.GetInputData',
            MAP: 'mapreduce.Summary',
            REDUCE: 'mapreduce.Reduce',
            SUMMARIZE: 'mapreduce.Summary'
        }

        let TEXTS = {
            ERROR_ON_CUSTOMER_PAYMENT: 'Error en la creación del pago',
            FAILURE_APPLYING_ALL_INVOICES: 'No fue posible aplicar las siguientes facturas',
            ERROR_TIMBRADO: 'Error al timbrar timbrar el pago'
        };

        /**
         * Carga de los parámetros del script.
         */
        const loadScriptParameters = () => {
            try {
                SCRIPT_PARAMETERS = {};

                Object.values(CONFIG.SCRIPTS.MAP_REDUCE.PAGOS_GLOBALES.parameters).forEach(param => {

                    /* Verifica el tipo de un parámetro y asigna un valor al objeto `SCRIPT_PARAMETERS` según el tipo. */
                    switch (param.type) {
                        case 'SELECT':
                            SCRIPT_PARAMETERS[param.alias] = Number(runtime.getCurrentScript().getParameter({ name: param.id })) || ''
                            break;
                    }
                });

                log.audit({ title: 'Script parameters', details: SCRIPT_PARAMETERS });
            } catch (error) {
                log.error('loadScriptParameters : error:', error);
                throw error;
            }
        }

        const loadConfigRecord = () => {
            try {

                let { FIELDS } = CONFIG.RECORDS.CONFIG_PAGO_GLOBAL;

                const CONFIG_SEARCH = search.create({
                    type: CONFIG.RECORDS.CONFIG_PAGO_GLOBAL.id,
                    filters: [['isinactive', search.Operator.IS, 'F']],
                    columns: Object.values(FIELDS).map(fld => fld.id)
                }).run().getRange({ start: 0, end: 1 });

                if (0 === CONFIG_SEARCH.length) {
                    return;
                }

                return classes.configuracionPagoGlobal(Object.fromEntries(Object.values(FIELDS).map(field => [field.alias, common.getValuesFromObject({
                    objectType: common.constants().OBJECT_TYPE_SEARCH_RESULT,
                    fieldType: field.type,
                    fieldId: field.id,
                    object: CONFIG_SEARCH[0]
                })])));
            } catch (error) {
                log.error('loadConfigRecord : error:', error);
                throw error;
            }
        };

        /**
         * Inicialización de los elementos globales para ejecuión del script
         */
        const init = (stage) => {
            try {

                /** Configuración */
                if (!CONFIG) {
                    CONFIG = configModule.getConfiguration();
                    CONFIG.setup();
                }

                if (!SCRIPT_PARAMETERS) {
                    loadScriptParameters();
                }

                if (-1 !== [STAGES.GET_INPUT_DATA].indexOf(stage)) {
                    log.audit('init : ' + stage + ' : SCRIPT_PARAMETERS:', SCRIPT_PARAMETERS);
                    log.audit('init : ' + stage + ' : CONFIG:', CONFIG);
                }

                if (!CONFIG_RECORD) {
                    CONFIG_RECORD = loadConfigRecord();
                    log.debug('init : CONFIG_RECORD:', CONFIG_RECORD);
                }

            } catch (error) {
                log.error({ title: 'initStage', details: error });
                throw error;
            }
        }

        const updatePagoGlobalRecord = ({ pagoGlobalUpdates }) => {

            log.audit('updatePagoGlobalRecord:', pagoGlobalUpdates);

            if (0 === Object.entries(pagoGlobalUpdates).length || !SCRIPT_PARAMETERS.pagoGlobal) {
                return;
            }

            record.submitFields({ type: CONFIG.RECORDS.PAGO_GLOBAL.id, id: SCRIPT_PARAMETERS.pagoGlobal, values: pagoGlobalUpdates });
        }

        const getInputData = (inputContext) => {
            try {
                log.debug('getInputData : inputContext:', inputContext);

                init(inputContext.type);

                if (SCRIPT_PARAMETERS.pagoGlobal) {

                    pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.EN_PROCESO;
                    updatePagoGlobalRecord({ pagoGlobalUpdates });
                }

                return [SCRIPT_PARAMETERS.pagoGlobal];
            } catch (error) {
                log.error('getInputData : error:', error);

                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = error.message;
                updatePagoGlobalRecord({ pagoGlobalUpdates });
            }
        }

        const getPagoGlobal = ({ pagoGlobalId }) => {
            try {

                const PAGO_GLOBAL_RECORD = record.load({
                    type: CONFIG.RECORDS.PAGO_GLOBAL.id,
                    id: pagoGlobalId
                });

                const { FIELDS } = CONFIG.RECORDS.PAGO_GLOBAL;

                const PAGO_GLOBAL = Object.fromEntries([
                    FIELDS.STATUS, FIELDS.CLIENTE, FIELDS.FECHA, FIELDS.FACTURA_CONSOLIDADA, FIELDS.PAGO_CLIENTE_GLOBAL, FIELDS.CUENTA, FIELDS.MONEDA, FIELDS.METODO_PAGO,
                    FIELDS.USO_CFDI, FIELDS.FORMA_PAGO, FIELDS.PRORRATEO_PAGO].map(field => [field.alias, common.getValuesFromObject({
                        objectType: common.constants().OBJECT_TYPE_RECORD,
                        fieldType: field.type,
                        fieldId: field.id,
                        object: PAGO_GLOBAL_RECORD
                    })]));

                if (PAGO_GLOBAL.prorrateoPago && PAGO_GLOBAL.prorrateoPago.value) {
                    PAGO_GLOBAL.prorrateoPago.value = JSON.parse(PAGO_GLOBAL.prorrateoPago.value);
                }

                return PAGO_GLOBAL;
            } catch (error) {
                log.error('getPagoGlobal : error:', error);
                throw error;
            }
        }

        const map = (mapContext) => {
            try {

                init(mapContext.type);

                const MAP_VALUE = JSON.parse(mapContext.value);
                log.audit('map : MAP_VALUE: ' + typeof MAP_VALUE, MAP_VALUE);

                const PAGO_GLOBAL = getPagoGlobal({ pagoGlobalId: MAP_VALUE });
                log.audit('map : PAGO_GLOBAL:', PAGO_GLOBAL);

                mapContext.write({ key: MAP_VALUE, value: PAGO_GLOBAL });

            } catch (error) {
                log.error('map : error:', error);

                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = error.message;
                updatePagoGlobalRecord({ pagoGlobalUpdates });
            }
        }

        const createCustomerPayment = ({ customerId, tranDate, location, accountId, currencyId, paymentMethodId, formaPago, cfdiUsageId, eDocumentTemplate,
            eDocumentSendingMethod, applicationInvoices,facturaConsolidada }) => {
            let res = { customerPaymentId: '', allInvoicesApplied: false, error: '' };
            try {
                //let facturaConsolidadaId = context.parameters.facturaConsolidadaId;
                log.audit('createCustomerPayment :', { customerId, tranDate, location, accountId, currencyId, paymentMethodId, cfdiUsageId, eDocumentTemplate, eDocumentSendingMethod });
                log.audit('createCustomerPayment :', { applicationInvoices });

                let CUSTOMER_PAYMENT = record.create({
                    type: record.Type.CUSTOMER_PAYMENT, isDynamic: true
                });

                const { TRANSACTION_BODY } = CONFIG.FIELDS;

                // Cliente

                CUSTOMER_PAYMENT.setValue({ fieldId: 'customer', value: customerId });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.CURRENCY.id, value: currencyId });

                if (accountId) {
                    CUSTOMER_PAYMENT.setValue({ fieldId: 'account', value: accountId });
                } else {
                    CUSTOMER_PAYMENT.setValue({ fieldId: 'undepfunds', value: 'T' });
                }

                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.TRANDATE.id, value: format.parse({ value: tranDate, type: format.Type.DATE }) });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.LOCATION.id, value: location });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.PAYMENT_METHOD.id, value: paymentMethodId });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.SAT_PAYMENT_METHOD.id, value: formaPago });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.CFDI_USAGE.id, value: cfdiUsageId });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.CUSTBODY_CFDI_USAGE.id, value: cfdiUsageId });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.E_DOCUMENT_TEMPLATE.id, value: CONFIG_RECORD._cpEDocumentTemplate.value });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.E_DOCUMENT_SENDING_METHOD.id, value: CONFIG_RECORD._cpEDocumentSendingMethod.value });
                CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.FACTURA_GLOBAL.id, value:facturaConsolidada});
                //CUSTOMER_PAYMENT.setValue({ fieldId: TRANSACTION_BODY.ES_PAGO_GLOBAL.id, value: 'TRUE' });//Modificación hecha por anibal
                
                // var esPagoGlobalValue = CUSTOMER_PAYMENT.getValue({
                //     fieldId: TRANSACTION_BODY.ES_PAGO_GLOBAL.id
                // });
                var facturaGlobalValue = CUSTOMER_PAYMENT.getValue({
                    fieldId: TRANSACTION_BODY.FACTURA_GLOBAL.id
                });
                log.audit({title:'FACTURA GLOBAL SETEADA', details:facturaGlobalValue});
                applyPayment: {

                    if (!applicationInvoices || !(0 < applicationInvoices.length)) {
                        break applyPayment;
                    }

                    const APPLYING_SUBLIST_COUNT = CUSTOMER_PAYMENT.getLineCount({ sublistId: 'apply' });

                    let applyingInvoiceId = '';

                    for (let rowIndex = 0; rowIndex < APPLYING_SUBLIST_COUNT; rowIndex++) {

                        applyingInvoiceId = CUSTOMER_PAYMENT.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: rowIndex }) || '';

                        if (applyingInvoiceId && applicationInvoices.some(invoice => {
                            return (Number(invoice.custpage_column_invc_internalid) === Number(applyingInvoiceId) && 0.00 < Number(invoice.custpage_column_invc_total_payment))
                        })) {

                            const MATCHED_INVOICE_INDEX = applicationInvoices.findIndex(invoice => Number(invoice.custpage_column_invc_internalid) === Number(applyingInvoiceId));

                            CUSTOMER_PAYMENT.selectLine({ sublistId: 'apply', line: rowIndex });

                            CUSTOMER_PAYMENT.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                            CUSTOMER_PAYMENT.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(applicationInvoices[MATCHED_INVOICE_INDEX].custpage_column_invc_total_payment) });
                            CUSTOMER_PAYMENT.commitLine({ sublistId: 'apply' });

                            applicationInvoices[MATCHED_INVOICE_INDEX].applied = true;
                        }
                    }

                    log.audit('createCustomerPayment : Invoice applying:', applicationInvoices);

                    res.allInvoicesApplied = applicationInvoices.every(invoice => true === invoice.applied);

                    if (!res.allInvoicesApplied) {
                        res.error = TEXTS.FAILURE_APPLYING_ALL_INVOICES + applicationInvoices.filter(invoice => false === invoice.applied)
                            .map(invoice => invoice.custpage_column_invc_tranid).toString();
                        return res;
                    }

                    res.customerPaymentId = CUSTOMER_PAYMENT.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: false
                    });
                }
                
            } catch (error) {
                log.error('createCustomerPayment : error:', error);
                res.error = error.message;
            }

            return res;
        }

        const getInvoices = ({ invoicesId }) => {

            if (!invoicesId) {
                return [];
            }

            let invoices = [];

            try {

                const { TRANSACTION_BODY } = CONFIG.FIELDS;

                const INVOICE_FIELDS = [TRANSACTION_BODY.INTERNALID, TRANSACTION_BODY.TRANID, TRANSACTION_BODY.E_DOCUMENT_TEMPLATE, TRANSACTION_BODY.E_DOCUMENT_SENDING_METHOD,
                TRANSACTION_BODY.LOCATION];

                search.create({
                    type: search.Type.INVOICE,
                    filters: [
                        ['internalid', search.Operator.ANYOF, invoicesId]
                    ],
                    columns: INVOICE_FIELDS.map(field => field.id)
                }).run().each(result => {

                    invoices.push(classes.invoice(Object.fromEntries(INVOICE_FIELDS.map(field => [field.alias, common.getValuesFromObject({
                        objectType: common.constants().OBJECT_TYPE_SEARCH_RESULT,
                        fieldType: field.type,
                        fieldId: field.id,
                        object: result
                    })]))));

                    return true;
                });

            } catch (error) {
                log.error('getInvoices : error:', error);
            }

            return invoices;
        };
        const changeStatusOfGlobalInvoice= (facturaConsolidada)=>{
            try{
                const globalInvoice = record.load({
                    type: CONFIG.TRANSACTIONS.FACTURA_GLOBAL.id, 
                    id: facturaConsolidada,
                    isDynamic: true, 
                });
                globalInvoice.setValue({fieldId:'custbody_efx_fe_gbl_pagado',value:true});
                globalInvoice.setValue({fieldId:'transtatus',value:'B'});
                globalInvoice.save({ enableSourcing: true, ignoreMandatoryFields: true });
                log.audit('Changed tranid of global invoice', { facturaConsolidada});
            } catch (error) {
                log.error('Error changing tranid of global invoice', { facturaConsolidada,error });
                throw error;
            }
         };
        const reduce = (reduceContext) => {
            try {

                init(reduceContext.type);

                const PAGO_GLOBAL_DATA = JSON.parse(reduceContext.values[0]);
                log.audit('reduce : PAGO_GLOBAL_DATA:', PAGO_GLOBAL_DATA);

                const INVOICES = getInvoices({ invoicesId: PAGO_GLOBAL_DATA.prorrateoPago.value.map(invoice => Number(invoice.custpage_column_invc_internalid)) });
                log.audit('reduce : INVOICES:', INVOICES);

                customerPayment: {

                    if (PAGO_GLOBAL_DATA.pagoClienteGlobal.value) {
                        PAGO_GLOBAL_DATA.pagoClienteGlobal.value = PAGO_GLOBAL_DATA.pagoClienteGlobal.value;
                        break customerPayment;
                    }
                      
                    let CUSTOMER_PAYMENT_RESULT = createCustomerPayment({
                        customerId: PAGO_GLOBAL_DATA.cliente.value,
                        tranDate: PAGO_GLOBAL_DATA.fecha.text,
                        location: INVOICES.filter(invoice => invoice._location.value)[0]._location.value,
                        accountId: PAGO_GLOBAL_DATA.cuenta.value,
                        currencyId: PAGO_GLOBAL_DATA.moneda.value,
                        paymentMethodId: PAGO_GLOBAL_DATA.formaPago.value,
                        formaPago: PAGO_GLOBAL_DATA.formaPago.value,
                        cfdiUsageId: PAGO_GLOBAL_DATA.usoCfdi.value,
                        // cfdiUsageId: PAGO_GLOBAL_DATA.usoCfdi.value,
                        applicationInvoices: PAGO_GLOBAL_DATA.prorrateoPago.value,
                        eDocumentTemplate: INVOICES.filter(invoice => invoice._eDocumentTemplate.value)[0]._eDocumentTemplate.value,
                        eDocumentSendingMethod: INVOICES.filter(invoice => invoice._eDocumentSendingMethod.value)[0]._eDocumentSendingMethod.value,
                        facturaConsolidada: PAGO_GLOBAL_DATA.facturaConsolidada.value
                    });

                    log.audit('reduce : CUSTOMER_PAYMENT_RESULT:', CUSTOMER_PAYMENT_RESULT);

                    if (!CUSTOMER_PAYMENT_RESULT.customerPaymentId || CUSTOMER_PAYMENT_RESULT.error) {

                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = TEXTS.ERROR_ON_CUSTOMER_PAYMENT + '\n' + CUSTOMER_PAYMENT_RESULT.error;
                        break customerPayment;
                    }

                    PAGO_GLOBAL_DATA.pagoClienteGlobal.value = CUSTOMER_PAYMENT_RESULT.customerPaymentId;

                    pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.PAGO_CLIENTE_GLOBAL.id] = CUSTOMER_PAYMENT_RESULT.customerPaymentId;
                    pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = '';
                    pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.PAGO_PROCESADO;

                    updatePagoGlobalRecord({ pagoGlobalUpdates });
                }

                log.audit('reduce : PAGO_GLOBAL_DATA:', PAGO_GLOBAL_DATA);

                timbrado: {

                    if (!PAGO_GLOBAL_DATA.pagoClienteGlobal.value) {
                        break timbrado;
                    }

                    const isCustomerPaymentAlreadyTimbrado = () => {

                        const { TRANSACTION_BODY } = CONFIG.FIELDS;

                        let CUSTOMER_PAYMENT_LOOKUP = search.lookupFields({
                            type: record.Type.CUSTOMER_PAYMENT,
                            id: PAGO_GLOBAL_DATA.pagoClienteGlobal.value,
                            columns: [TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC.id, TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF.id]
                        });

                        CUSTOMER_PAYMENT_LOOKUP = Object.fromEntries([TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC, TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF]
                            .map(field => [field.alias, common.getValuesFromObject({
                                objectType: common.constants().OBJECT_TYPE_LOOKUP_FIELDS,
                                fieldType: field.type,
                                fieldId: field.id,
                                object: CUSTOMER_PAYMENT_LOOKUP
                            })]))

                        return ((CUSTOMER_PAYMENT_LOOKUP.hasOwnProperty('psgEiCertifiedEdoc') && CUSTOMER_PAYMENT_LOOKUP.psgEiCertifiedEdoc.value) ||
                            (CUSTOMER_PAYMENT_LOOKUP.hasOwnProperty('eDocumentGeneratedPdf') && CUSTOMER_PAYMENT_LOOKUP.eDocumentGeneratedPdf.value));
                    }

                    if (isCustomerPaymentAlreadyTimbrado()) {
                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = '';
                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.TIMBRADO;
                        break timbrado;
                    }

                    try {

                        let TIMBRADO_PAGO_GLOBAL = https.get({
                            url: url.resolveScript({
                                scriptId: CONFIG.SCRIPTS.SUITELET.EFX_FE_XML_GENERATOR.id,
                                deploymentId: CONFIG.SCRIPTS.SUITELET.EFX_FE_XML_GENERATOR.deployments[0],
                                params: Object.fromEntries([
                                    [CONFIG.SCRIPTS.SUITELET.EFX_FE_XML_GENERATOR.parameters.TRANSACTION_TYPE.id, record.Type.CUSTOMER_PAYMENT],
                                    [CONFIG.SCRIPTS.SUITELET.EFX_FE_XML_GENERATOR.parameters.TRANSACTION_INTERNALID.id, PAGO_GLOBAL_DATA.pagoClienteGlobal.value]
                                ]),
                                returnExternalUrl: true
                            })
                        });
                        log.audit('reduce : TIMBRADO_PAGO_GLOBAL:', TIMBRADO_PAGO_GLOBAL);

                        if (!TIMBRADO_PAGO_GLOBAL) {
                            break timbrado;
                        }

                        TIMBRADO_PAGO_GLOBAL = JSON.parse(TIMBRADO_PAGO_GLOBAL.body);
                        log.audit('reduce : TIMBRADO_PAGO_GLOBAL:', TIMBRADO_PAGO_GLOBAL);

                        if (TIMBRADO_PAGO_GLOBAL.success) {
                            pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = '';
                            pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.TIMBRADO;
                        } else {
                            pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                            pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = TEXTS.ERROR_TIMBRADO + '. ' + TIMBRADO_PAGO_GLOBAL.error_details;
                        }
                    } catch (error) {
                        log.error('timbrarTransacction : error:', error);

                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                        pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = TEXTS.ERROR_TIMBRADO + '. ' + error.message;
                        updatePagoGlobalRecord({ pagoGlobalUpdates });
                    }
                }

                changeStatusOfGlobalInvoice(PAGO_GLOBAL_DATA.facturaConsolidada.value)
                updatePagoGlobalRecord({ pagoGlobalUpdates });
            } catch (error) {
                log.error('reduce : error:', error);

                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.STATUS.id] = CONFIG.LISTS.ESTATUS_PROCESO.values.ERROR;
                pagoGlobalUpdates[CONFIG.RECORDS.PAGO_GLOBAL.FIELDS.NOTAS.id] = error.message;
                updatePagoGlobalRecord({ pagoGlobalUpdates });
            }
        }

        const summarize = (summaryContext) => {
            try {

                log.audit('summarize : summaryContext:', summaryContext);

            } catch (error) {
                log.error('summarize : error:', error);
            }
        }

        return { getInputData, map, reduce, summarize }

    });