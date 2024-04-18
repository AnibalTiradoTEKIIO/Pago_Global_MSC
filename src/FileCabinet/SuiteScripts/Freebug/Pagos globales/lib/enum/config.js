/**
 * @NApiVersion 2.1
 */
define([],
    () => {

        class configuration {

            constructor() {

                this.LISTS = {};
                this.FIELDS = {};
                this.RECORDS = {};
                this.TRANSACTIONS = {};
                this.SCRIPTS = {};
                this.SAVED_SEARCHS = {};
            }

            setup() {

                this.setupObjets();
                this.setupScripts();
                this.setupSettings();
            }

            setupObjets() {

                /** Registros */

                this.RECORDS.PAGO_GLOBAL = {
                    id: 'customrecord_fb_pago_global',
                    FIELDS: {
                        INTERNALID: { id: 'internalid', name: 'Internal ID', alias: 'internalId', type: 'TEXT' },
                        NAME: { id: 'name', name: '', alias: 'name', type: 'TEXT' },
                        STATUS: { id: 'custrecord_fb_pg_status', name: '', alias: 'status', type: 'MULTISELECT' },
                        CLIENTE: { id: 'custrecord_fb_pg_customer', name: 'Cliente', alias: 'cliente', type: 'SELECT' },
                        FECHA: { id: 'custrecord_fb_pg_date', name: '', alias: 'fecha', type: 'DATE' },
                        FACTURA_CONSOLIDADA: { id: 'custrecord_fb_pg_consolidated_invoice', name: '', alias: 'facturaConsolidada', type: 'SELECT' },
                        PAGO_CLIENTE_GLOBAL: { id: 'custrecord_fb_pg_global_payment', name: '', alias: 'pagoClienteGlobal', type: 'SELECT' },
                        CUENTA: { id: 'custrecord_fb_pg_cuenta', name: '', alias: 'cuenta', type: 'SELECT' },
                        MONEDA: { id: 'custrecord_fb_pg_currency', name: '', alias: 'moneda', type: 'SELECT' },
                        //METODO_PAGO: { id: 'custrecord_fb_pg_payment_method', name: '', alias: 'metodoPago', type: 'SELECT' },
                        USO_CFDI: { id: 'custrecord_fb_pg_uso_cfdi', name: '', alias: 'usoCfdi', type: 'SELECT' },
                        FORMA_PAGO: { id: 'custrecord_fb_pg_forma_pago', name: '', alias: 'formaPago', type: 'SELECT' },
                        PRORRATEO_PAGO: { id: 'custrecord_fb_pg_payment_proration', name: '', alias: 'prorrateoPago', type: 'TEXT' },
                        FACTURAS: { id: 'custrecord_fb_pg_invoices', name: '', alias: 'facturas', type: 'MULTISELECT' },
                        NOTAS: { id: 'custrecord_fb_pg_notes', name: '', alias: 'notas', type: 'TEXT' },
                    }
                };

                this.RECORDS.CONFIG_PAGO_GLOBAL = {
                    id: 'customrecord_fb_pg_configuration',
                    FIELDS: {
                        CP_E_DOCUMENT_SENDING_METHOD: { id: 'custrecord_fbpgc_cp_sending_method', name: '', alias: 'cpEDocumentSendingMethod', type: 'SELECT' },
                        CP_E_DOCUMENT_TEMPLATE: { id: 'custrecord_fgpgc_cp_edoc_template', name: '', alias: 'cpEDocumentTemplate', type: 'SELECT' }
                    }
                };

                this.TRANSACTIONS.FACTURA_GLOBAL = {
                    id: 'customsale_efx_fe_factura_global',
                    FIELDS: {}
                };

                /** Campos */

                this.FIELDS.TRANSACTION_BODY = {
                    INTERNALID: { id: 'internalid', name: 'Internal ID', alias: 'internalId', type: 'TEXT' },
                    APPROVAL_STATUS: { id: 'approvalstatus', name: '', alias: 'approvalStatus', type: 'SELECT' },
                    TRANID: { id: 'tranid', name: 'Tran ID', alias: 'tranId', type: 'TEXT' },
                    TRANDATE: { id: 'trandate', name: 'Date', alias: 'tranDate', type: 'TEXT' },
                    ENTITY: { id: 'entity', name: 'Entity', alias: 'entity', type: 'SELECT' },
                    SUBSIDIARY: { id: 'subsidiary', name: 'Subsidiary', alias: 'subsidiary', type: 'SELECT' },
                    LOCATION: { id: 'location', name: 'Location', alias: 'location', type: 'SELECT' },
                    TOTAL: { id: 'total', name: 'Total', alias: 'total', type: 'CURRENCY' },
                    CURRENCY: { id: 'currency', name: '', alias: 'currency', type: 'SELECT' },
                    TAX_TOTAL: { id: 'taxtotal', name: 'Tax total', alias: 'taxTotal', type: 'CURRENCY' },
                    DISCOUNT_TOTAL: { id: 'discounttotal', name: 'Discount total', alias: 'discountTotal', type: 'CURRENCY' },
                    AMOUNT_REMAINING: { id: 'amountremaining', name: '', alias: 'amountRemaining', type: 'CURRENCY' },
                    MEMO: { id: 'memo', name: 'Memo', alias: 'memo', type: 'TEXT' },
                    TRANSACCIONES_GLB: { id: 'custbody_efx_fe_gbl_transactions', name: '', alias: 'transaccionesGlb', type: 'MULTISELECT' },
                    PAYMENT_METHOD: { id: 'paymentmethod', name: '', alias: 'paymentMethod', type: 'SELECT' },
                    FE_USO_CDFI: { id: 'custbody_efx_fe_usocfdi', name: '', alias: 'cfdiUsage', type: 'SELECT' },
                    SAT_PAYMENT_METHOD: { id: 'custbody_mx_txn_sat_payment_method', name: '', alias: 'satPaymentMethod', type: 'SELECT' },
                    SAT_PAYMENT_TERM: { id: 'custbody_mx_txn_sat_payment_term', name: '', alias: 'satPaymentTerm', type: 'SELECT' },
                    E_DOCUMENT_TEMPLATE: { id: 'custbody_psg_ei_template', name: '', alias: 'eDocumentTemplate', type: 'SELECT' },
                    E_DOCUMENT_SENDING_METHOD: { id: 'custbody_psg_ei_sending_method', name: '', alias: 'eDocumentSendingMethod', type: 'SELECT' },
                    E_DOCUMENT_GENERATED_PDF: { id: 'custbody_edoc_generated_pdf', name: '', alias: 'eDocumentGeneratedPdf', type: 'SELECT' },
                    PSG_EI_CERTIFIED_EDOC: { id: 'custbody_psg_ei_certified_edoc', name: '', alias: 'psgEiCertifiedEdoc', type: 'SELECT' },
                    CFDI_USAGE: { id: 'custbody_mx_cfdi_usage', name: '', alias: 'cfdiUsage', type: 'SELECT' },
                    CUSTBODY_CFDI_USAGE: { id: 'custbody_efx_fe_usocfdi', name: '', alias: 'cfdiUsage', type: 'SELECT' },
                   // ES_PAGO_GLOBAL:{id: 'custbody_efx_fe_gbl_espagoglobal',name: '',alias: 'esPagoGlobal', type: 'TEXT'},
                    FACTURA_GLOBAL:{id:'custbody_efx_fe_id_facturaglobal',name: '',alias:'facturaGlobal',type: 'SELECT'},
                };
            }

            setupScripts() {

                /** Listas */

                this.LISTS.ESTATUS_PROCESO = {
                    id: 'customlist_fb_pg_status',
                    values: {
                        PENDIENTE: 1, EN_PROCESO: 2, PAGO_PROCESADO: 3, ERROR: 4, TIMBRADO: 5
                    }
                };

                /**
                 * Configuración de scripts relacionados
                 */

                this.SCRIPTS.MAP_REDUCE = {
                    PAGOS_GLOBALES: {
                        id: 'customscript_fb_pagos_globales_mr',
                        name: 'Pagos Globales MR',
                        deployments: ['customdeploy_fb_pagos_globales_mr', 'customdeploy_fb_pagos_globales_mr_2', 'customdeploy_fb_pagos_globales_mr_3'],
                        scriptFile: 'Pagos_Globales_MR.js',
                        parameters: {
                            PAGO_GLOBAL: {
                                id: 'custscript_fb_pgmr_pago_global', name: '', alias: 'pagoGlobal', type: 'SELECT', isMandatory: true
                            }
                        }
                    }
                };

                this.SCRIPTS.USER_EVENT = {
                    PAGOS_GLOBALES_FG: {
                        id: 'customscript_fb_pagos_globales_fg_ue',
                        name: 'Pagos Globales FG UE',
                        deployments: ['customdeploy_fb_pagos_globales_fg_ue'],
                        scriptFile: 'Pagos_Globales_FG_UE.js',
                        parameters: {}
                    }
                };

                this.SCRIPTS.SUITELET = {
                    PAGOS_GLOBALES: {
                        id: 'customscript_fb_pagos_globales_sl',
                        name: 'Pagos Globales SL',
                        deployments: ['customdeploy_fb_pagos_globales_sl'],
                        scriptFile: 'Pagos_Globales_SL.js',
                        parameters: {
                            FACTURA_CONSOLIDADA: {
                                id: 'custscript_fb_pgsl_factura_consolidada', name: 'Factura', alias: 'facturaConsolidada', type: 'SELECT', isMandatory: false
                            },
                            CLIENTE: {
                                id: 'custscript_fb_pgsl_cliente', name: 'Cliente', alias: 'cliente', type: 'SELECT', isMandatory: false
                            },
                            REPROCESAR_PAGO_GLOBAL: {
                                id: 'custscript_fb_pgsl_reprocesar_pg', name: 'Reprocesar Pago global', alias: 'reprocesarPagoGlobal', type: 'CHECK', isMandatory: false
                            },
                            PAGO_GLOBAL: {
                                id: 'custscript_fb_pgsl_pago_global', name: 'Pago global', alias: 'pagoGlobal', type: 'SELECT', isMandatory: false
                            }
                        }
                    },
                    EFX_FE_XML_GENERATOR: {
                        id: 'customscript_efx_fe_xml_generator',
                        name: '',
                        deployments: ['customdeploy_efx_fe_xml_generator'],
                        scriptFile: 'EFX_FE_XML_Generator.js',
                        parameters: {
                            TRANSACTION_INTERNALID: {
                                id: 'tranid', name: '', alias: '', type: '', isMandatory: false
                            },
                            TRANSACTION_TYPE: {
                                id: 'trantype', name: '', alias: '', type: '', isMandatory: false
                            }
                        }
                    }
                };

                this.SCRIPTS.CLIENT = {
                    PAGOS_GLOBALES: {
                        id: 'customscript_fb_pagos_globales_cs',
                        name: 'Pagos Globales CS',
                        deployments: [''],
                        scriptFile: 'Pagos_Globales_CS.js',
                        parameters: []
                    },
                    PAGOS_GLOBALES_FG: {
                        id: 'customscript_fb_pagos_globales_fg_cs',
                        name: 'Pagos Globales FG CS',
                        deployments: [''],
                        scriptFile: 'Pagos_Globales_FG_CS.js',
                        parameters: []
                    }
                };

                this.SAVED_SEARCHS.PROCESO_PAGOS_GLOBALES = {
                    id: 'customsearch_fb_pagos_globales',
                };
            }

            setupSettings() {

                /**
                 * Configuración de las preferencias
                 */
            }

            get records() { return this.RECORDS; }

            get transactions() { return this.TRANSACTIONS; }

            get fields() { return this.FIELDS; }

            get scripts() { return this.SCRIPTS; }

            get settings() { return this.SETTINGS; }
        }

        const getConfiguration = () => {

            return new configuration();
        };

        return { getConfiguration }
    });