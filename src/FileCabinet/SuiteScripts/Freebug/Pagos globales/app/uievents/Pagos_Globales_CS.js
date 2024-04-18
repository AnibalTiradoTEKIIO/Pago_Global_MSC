/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'SuiteScripts/Freebug/Pagos globales/app/ui/config.js', 'SuiteScripts/Freebug/Pagos globales/lib/enum/config.js',
    'SuiteScripts/Freebug/Pagos globales/lib/enum/common.js', 'SuiteScripts/Freebug/Pagos globales/lib/enum/classes.js'],

    function (url, record, search, message, currentRecord, uiConfig, configModule, common, classes) {

        let CURRENT_RECORD, FORM_DATA, FACTURA_GLOBAL_INVOICES;

        let ALLOW_MODIFICATIONS = false;

        let CONFIG = configModule.getConfiguration();
        let UI_CONFIG = uiConfig.getConfiguration();

        CONFIG.setup();
        UI_CONFIG.setupForms();

        let { BODY_FIELDS } = UI_CONFIG.FORMS.PAGOS_GLOBALES;
        let { LINE_FIELDS } = UI_CONFIG.FORMS.PAGOS_GLOBALES;

        let TEXTS = {
            ERROR: 'Error',
            TRY_LATER: 'Por favor, intente más tarde',
            FAIL_PROCESSING_REQ: 'Solicitud no procesada',
            WARNING: 'Alerta',
            INVALID_PAYMENT_AMOUNT: 'El importe a apagar no es válido',
            INVALID_PAYMENT_AMOUNT_ON_SAVE: 'El importe a pagar no debe superar al importe a aplicar y debe cubrir el monto total adeudado en las facturas',
            NO_PENDING_INVOICES: 'La factura global no cuenta con transacciones pendientes de pago.'
        };

        const getInvoices = ({ invoicesId }) => {

            if (!invoicesId) {
                return [];
            }

            let invoices = [];

            try {

                const { TRANSACTION_BODY } = CONFIG.FIELDS;

                const INVOICE_FIELDS = [TRANSACTION_BODY.INTERNALID, TRANSACTION_BODY.TRANID, TRANSACTION_BODY.ENTITY, TRANSACTION_BODY.TRANDATE,
                TRANSACTION_BODY.TOTAL, TRANSACTION_BODY.CURRENCY, TRANSACTION_BODY.AMOUNT_REMAINING, TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF,
                TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC];

                search.create({
                    type: search.Type.INVOICE,
                    filters: [
                        ['mainline', search.Operator.IS, 'T'], 'AND',
                        [TRANSACTION_BODY.INTERNALID.id, search.Operator.ANYOF, invoicesId], 'AND',
                        [TRANSACTION_BODY.AMOUNT_REMAINING.id, search.Operator.GREATERTHAN, '0.00'], 'AND',
                        [TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF.id, search.Operator.NONEOF, '@NONE@'], 'AND',
                        [TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC.id, search.Operator.NONEOF, '@NONE@']
                    ],
                    columns: [
                        search.createColumn({ name: 'datecreated', sort: search.Sort.ASC }),
                        ...INVOICE_FIELDS.map(field => field.id)
                    ]
                }).run().each(result => {

                    console.log('getInvoices : result:', JSON.stringify(result));

                    if (!result.getValue({ name: TRANSACTION_BODY.E_DOCUMENT_GENERATED_PDF.id })
                        || !result.getValue({ name: TRANSACTION_BODY.PSG_EI_CERTIFIED_EDOC.id })) {
                        return;
                    }

                    invoices.push(classes.invoice(Object.fromEntries(INVOICE_FIELDS.map(field => [field.alias, common.getValuesFromObject({
                        objectType: common.constants().OBJECT_TYPE_SEARCH_RESULT,
                        fieldType: field.type,
                        fieldId: field.id,
                        object: result
                    })]))));

                    return true;
                });

            } catch (error) {
                console.log('getInvoices : error:', error);
            }

            return invoices;
        };

        const getSublistValues = () => {
            try {

                const SUBLIST_COLUMNS = Object.values(LINE_FIELDS);

                const SUBLIST_COUNT_ROWS = CURRENT_RECORD.getLineCount({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id });

                let sublistValues = [], rowIndex = 0;

                while (rowIndex < SUBLIST_COUNT_ROWS) {

                    sublistValues.push(Object.fromEntries(SUBLIST_COLUMNS.map(column => {
                        return [column.id, CURRENT_RECORD.getSublistValue({
                            sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                            fieldId: column.id, line: rowIndex
                        })];
                    })));

                    rowIndex++;
                }

                return sublistValues;
            } catch (error) {
                console.log('getSublistValues : error: ' + error);
            }
        };

        const setSublistValues = ({ sublistValues }) => {
            try {

                sublistValues.forEach((row, rowIndex) => {

                    row.forEach(field => {

                        CURRENT_RECORD.selectLine({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id, line: rowIndex })

                        CURRENT_RECORD.setCurrentSublistValue({
                            sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id, ...field
                        });

                        CURRENT_RECORD.commitLine({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id });

                    });
                });
            } catch (error) {
                console.log('setSublistValues : error: ' + error);
            }
        };

        const prorratear = () => {
            try {

                FORM_DATA = getFormData({ formFields: Object.values(BODY_FIELDS) });

                if (!FORM_DATA.importePagar.value || !(0 < Number(FORM_DATA.importePagar.value))) {

                    showMessage({
                        title: TEXTS.WARNING, text: TEXTS.INVALID_PAYMENT_AMOUNT,
                        type: message.Type.WARNING, duration: 4000
                    });

                    cleanForm();
                    return;
                }

                let SUBLIST_VALUES = getSublistValues();

                const SUBLIST_COUNT_ROWS = CURRENT_RECORD.getLineCount({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id });

                let rowIndex = 0, rowAmountToPay = 0;

                while (rowIndex < SUBLIST_COUNT_ROWS) {

                    CURRENT_RECORD.selectLine({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id, line: rowIndex })

                    rowAmountToPay = Math.min(FORM_DATA.importePagar.value, CURRENT_RECORD.getSublistValue({
                        sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                        fieldId: LINE_FIELDS.DUE_AMOUNT.id,
                        line: rowIndex
                    }));

                    CURRENT_RECORD.setCurrentSublistValue({
                        sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                        fieldId: LINE_FIELDS.TOTAL_PAYMENT.id,
                        value: rowAmountToPay
                    });

                    CURRENT_RECORD.commitLine({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id });

                    FORM_DATA.importePagar.value -= rowAmountToPay;
                    rowIndex++;
                }

                SUBLIST_VALUES = getSublistValues();

                CURRENT_RECORD.setValue({ fieldId: BODY_FIELDS.IMPORTE_TOTAL_APLICAR.id, value: SUBLIST_VALUES.reduce((total, invoiceRow) => total + invoiceRow.custpage_column_invc_total_payment, 0) });

            } catch (error) {
                console.log('prorratear : error:' + error);
            }
        }

        const getFormData = ({ formFields }) => {
            try {

                return Object.fromEntries(formFields.map(field => [field.alias, common.getValuesFromObject({
                    objectType: common.constants().OBJECT_TYPE_RECORD,
                    fieldType: field.type,
                    fieldId: field.id,
                    object: CURRENT_RECORD
                })]));

            } catch (error) {
                console.log('getFormData : error: ' + error)
            }
        }

        const cleanForm = () => {
            try {

                CURRENT_RECORD.setValue({ fieldId: BODY_FIELDS.IMPORTE_PAGAR.id, value: 0 });
                CURRENT_RECORD.setValue({ fieldId: BODY_FIELDS.IMPORTE_TOTAL_APLICAR.id, value: 0 });

            } catch (error) {
                console.log('cleanForm : error: ' + error);
            }
        };

        const updateSublits = () => {
            try {

                FORM_DATA = getFormData({ formFields: Object.values(BODY_FIELDS) });

                if (FORM_DATA.cliente.value && FORM_DATA.moneda.value) {
                    setSublistValues({
                        sublistValues: FACTURA_GLOBAL_INVOICES
                            .filter(invoice => invoice._entity.value == FORM_DATA.cliente.value && invoice._currency.value == FORM_DATA.moneda.value)
                            .map(invoice => [
                                { fieldId: LINE_FIELDS.INTERNALID.id, value: invoice._internalId.value },
                                { fieldId: LINE_FIELDS.TRAN_ID.id, value: invoice._tranId.value },
                                { fieldId: LINE_FIELDS.TRAN_DATE.id, value: invoice._tranDate.value },
                                { fieldId: LINE_FIELDS.CURRENCY.id, value: invoice._currency.text },
                                { fieldId: LINE_FIELDS.TOTAL.id, value: invoice._total.value },
                                { fieldId: LINE_FIELDS.DUE_AMOUNT.id, value: invoice._amountRemaining.value }]
                            )
                    });
                }

            } catch (error) {
                console.log(error);
            }
        }

        function pageInit() {
            try {

                CURRENT_RECORD = currentRecord.get();

                FORM_DATA = getFormData({ formFields: Object.values(BODY_FIELDS) });

                let errorsFldValue = CURRENT_RECORD.getValue({ fieldId: 'custpage_fld_errors' });
                let warningsFldValue = CURRENT_RECORD.getValue({ fieldId: 'custpage_fld_warnings' });

                if (errorsFldValue) {
                    showMessage({
                        title: TEXTS.ERROR, text: TEXTS.FAIL_PROCESSING_REQ + '<br><br>' + errorsFldValue + '<br><br>' +
                            TEXTS.TRY_LATER, type: message.Type.ERROR
                    });
                }

                if (warningsFldValue) {
                    showMessage({
                        title: TEXTS.WARNING, text: TEXTS.FAIL_PROCESSING_REQ + '<br><br>' + warningsFldValue,
                        type: message.Type.WARNING
                    });
                }

                if (FORM_DATA.facturaConsolidada.value) {

                    const FACTURA_GLOBAL_RECORD = record.load({ type: CONFIG.TRANSACTIONS.FACTURA_GLOBAL.id, id: FORM_DATA.facturaConsolidada.value });

                    const FACTURA_GLOBAL = classes.facturaGlobal(Object.fromEntries([CONFIG.FIELDS.TRANSACTION_BODY.INTERNALID,
                    CONFIG.FIELDS.TRANSACTION_BODY.ENTITY, CONFIG.FIELDS.TRANSACTION_BODY.TRANSACCIONES_GLB, CONFIG.FIELDS.TRANSACTION_BODY.CFDI_USAGE,
                    CONFIG.FIELDS.TRANSACTION_BODY.SAT_PAYMENT_METHOD].map(field => [field.alias, common.getValuesFromObject({
                        objectType: common.constants().OBJECT_TYPE_RECORD,
                        fieldType: field.type,
                        fieldId: field.id,
                        object: FACTURA_GLOBAL_RECORD
                    })])));

                    if (FACTURA_GLOBAL._transaccionesGlb && 0 < FACTURA_GLOBAL._transaccionesGlb.value.length) {

                        FACTURA_GLOBAL_INVOICES = getInvoices({ invoicesId: FACTURA_GLOBAL._transaccionesGlb.value });

                        if (!FACTURA_GLOBAL_INVOICES || 0 === FACTURA_GLOBAL_INVOICES.length) {

                            showMessage({ title: TEXTS.WARNING, text: TEXTS.NO_PENDING_INVOICES, type: message.Type.WARNING });
                            return;
                        }
                    } else {
                        showMessage({ title: TEXTS.WARNING, text: TEXTS.NO_PENDING_INVOICES, type: message.Type.WARNING });
                        return;
                    }

                    let fldClient = currentRecord.get().getField({
                        fieldId: UI_CONFIG.FORMS.PAGOS_GLOBALES.BODY_FIELDS.CLIENTE.id
                    });

                    [... new Set(FACTURA_GLOBAL_INVOICES.map(invoice => { return JSON.stringify(invoice._entity) }))]
                        .map(invoice => JSON.parse(invoice)).forEach((customer, index) => {
                            fldClient.insertSelectOption({ ...customer, isSelected: (0 === index) });
                        });

                    let fldCurrency = currentRecord.get().getField({
                        fieldId: UI_CONFIG.FORMS.PAGOS_GLOBALES.BODY_FIELDS.MONEDA.id
                    });

                    [... new Set(FACTURA_GLOBAL_INVOICES.map(invoice => { return JSON.stringify(invoice._currency) }))]
                        .map(invoice => JSON.parse(invoice)).forEach((customer, index) => {
                            fldCurrency.insertSelectOption({ ...customer, isSelected: (0 === index) });
                        });
                }

                updateSublits();

            } catch (error) {
                console.log(error);
            }

            return true;
        }

        const cleanSublist = () => {
            try {

                let SUBLIST_COUNT_ROWS = CURRENT_RECORD.getLineCount({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id });

                ALLOW_MODIFICATIONS = true;

                while (0 < SUBLIST_COUNT_ROWS) {

                    CURRENT_RECORD.selectLine({
                        sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                        line: (SUBLIST_COUNT_ROWS - 1)
                    });

                    CURRENT_RECORD.removeLine({
                        sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id,
                        line: (SUBLIST_COUNT_ROWS - 1)
                    });

                    SUBLIST_COUNT_ROWS--;
                }

                ALLOW_MODIFICATIONS = false;

            } catch (error) {
                console.log(error);
            }
        }

        function fieldChanged(scriptContext) {
            try {

                switch (scriptContext.fieldId) {
                    case BODY_FIELDS.IMPORTE_PAGAR.id:

                        if (CURRENT_RECORD.getValue({ fieldId: BODY_FIELDS.IMPORTE_PAGAR.id })) {
                            prorratear();
                        }

                        break;
                    case BODY_FIELDS.CLIENTE.id:
                    case BODY_FIELDS.MONEDA.id:

                        cleanSublist();

                        updateSublits();

                        break;
                    case BODY_FIELDS.FACTURA_CONSOLIDADA.id:

                        let FACTURA_GLOBAL = CURRENT_RECORD.getValue({ fieldId: BODY_FIELDS.FACTURA_CONSOLIDADA.id });

                        if (!FACTURA_GLOBAL) {
                            window.open(url.resolveScript({
                                scriptId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.id,
                                deploymentId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.deployments[0],
                                params: {}
                            }), '_self');
                            break;
                        }

                        let suiteletParams = {};
                        suiteletParams[CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.parameters.FACTURA_CONSOLIDADA.id] = Number(FACTURA_GLOBAL);

                        window.open(url.resolveScript({
                            scriptId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.id,
                            deploymentId: CONFIG.SCRIPTS.SUITELET.PAGOS_GLOBALES.deployments[0],
                            params: suiteletParams
                        }), '_self');

                        break;
                }
            } catch (error) {
                console.log('fieldChanged : error: ' + error);
            }
        }

        function saveRecord() {
            try {

                FORM_DATA = getFormData({ formFields: Object.values(BODY_FIELDS) });

                let SUBLIST_VALUES = getSublistValues();
              CURRENT_RECORD.setValue({ fieldId: BODY_FIELDS.IMPORTE_PAGAR.id, value:SUBLIST_VALUES.reduce((total, invoiceRow) => total + invoiceRow.custpage_column_invc_no_due_amount, 0)  });

                // if (0 === SUBLIST_VALUES.reduce((total, invoiceRow) => total + invoiceRow.custpage_column_invc_total_payment, 0)
                //     || !(0 < Number(FORM_DATA.importePagar.value))) {

                //     showMessage({
                //         title: TEXTS.WARNING, text: TEXTS.INVALID_PAYMENT_AMOUNT,
                //         type: message.Type.WARNING, duration: 4000
                //     });

                //     if (!(0 < Number(FORM_DATA.importePagar.value))) {
                //         cleanForm();
                //         cleanSublist();
                //         updateSublits();
                //     }

                //     return false;
                // }

                // console.log(FORM_DATA.importePagar.value + ' !== ' + SUBLIST_VALUES.reduce((total, invoiceRow) => total + invoiceRow.custpage_column_invc_no_due_amount, 0))

                // if (FORM_DATA.importePagar.value > FORM_DATA.importeTotalAplicar.value
                //     || FORM_DATA.importePagar.value !== SUBLIST_VALUES.reduce((total, invoiceRow) => total + invoiceRow.custpage_column_invc_no_due_amount, 0)) {

                //     showMessage({
                //         title: TEXTS.WARNING, text: TEXTS.INVALID_PAYMENT_AMOUNT_ON_SAVE,
                //         type: message.Type.WARNING, duration: 10000
                //     });

                //     return false;
                // }

                return true;
            } catch (error) {
                console.log('saveRecord : error: ' + error);
            }
        }

        function validateInsert() {
            return false;
        }

        function validateLine() {
            if (CURRENT_RECORD.getCurrentSublistValue({ sublistId: UI_CONFIG.FORMS.PAGOS_GLOBALES.SUBLISTS.FACTURAS.id, fieldId: LINE_FIELDS.INTERNALID.id })) {
                return true;
            }
        }

        function validateDelete() {
            try {
                return ALLOW_MODIFICATIONS;
            } catch (error) {
                console.log('validateDelete : error: ' + error);
            }
            return true;
        }


        function showMessage({ title, text, type, duration }) {
            try {
                var msg = message.create({ title: title, message: text, type: type });
                if (duration) {
                    msg.show({ duration: duration });
                } else {
                    msg.show();
                }
            } catch (error) {
                console.log('showMessage: ' + error);
            }
        }

        return {
            pageInit, fieldChanged, saveRecord, validateLine, validateInsert, validateDelete
        };

    });