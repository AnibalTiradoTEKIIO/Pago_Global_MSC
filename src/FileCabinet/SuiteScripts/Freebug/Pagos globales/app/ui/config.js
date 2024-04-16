/**
 * @NApiVersion 2.1
 */
define([], () => {

    class configuration {

        constructor() {

            this.FORMS = {};
        }

        setup() {

            this.setupForms();
        }

        setupForms() {

            this.FORMS = {
                PAGOS_GLOBALES: {
                    title: 'Pago Global'
                }
            };

            this.FORMS.PAGOS_GLOBALES.SUBLISTS = {
                FACTURAS: {
                    id: 'custpage_sublist_invoices'
                }
            }

            this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS = {
                MAIN: { id: 'fieldgroup_main', label: 'Información Principal' },
                GLOBAL_PAYMENT: { id: 'fieldgroup_global_payment', label: 'Información Pago Global' }
            }
            
            this.FORMS.PAGOS_GLOBALES.BODY_FIELDS = {
                CLIENTE: {
                    id: 'custpage_fld_cliente',
                    alias: 'cliente',
                    label: 'Cliente',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                MONEDA: {
                    id: 'custpage_fld_moneda',
                    alias: 'moneda',
                    label: 'Moneda',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                FACTURA_CONSOLIDADA: {
                    id: 'custpage_fld_factura_consolidada',
                    alias: 'facturaConsolidada',
                    label: 'Factura global',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                IMPORTE_PAGAR: {
                    id: 'custpage_fld_importe_pagar',
                    alias: 'importePagar',
                    label: 'Importe a Pagar',
                    type: 'CURRENCY',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                IMPORTE_TOTAL_ADEUDADO: {
                    id: 'custpage_fld_importe_total_adeudado',
                    alias: 'totalAdeudado',
                    label: 'Importe Total Adeudado',
                    type: 'CURRENCY',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                IMPORTE_TOTAL_APLICAR: {
                    id: 'custpage_fld_importe_total_aplicar',
                    alias: 'importeTotalAplicar',
                    label: 'Importe Total a Aplicar',
                    type: 'CURRENCY',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                PARCIALIDAD: {
                    id: 'custpage_fld_parcialidad',
                    alias: 'parcialidad',
                    label: 'Parcialidad',
                    type: 'TEXT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.MAIN.id
                },
                METODO_PAGO: {
                    id: 'custpage_fld_metodo_pago',
                    alias: 'metodoPago',
                    label: 'Método de Pago',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT.id
                },
                USO_CFDI: {
                    id: 'custpage_fld_uso_cfdi',
                    alias: 'usoCdfi',
                    label: 'Uso de CFDI',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT.id
                },
                CUENTA: {
                    id: 'custpage_fld_account',
                    alias: 'cuenta',
                    label: 'Cuenta',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT.id
                },
                FECHA_PAGO: {
                    id: 'custpage_fld_fecha_pago',
                    alias: 'fechaPago',
                    label: 'Fecha de Pago',
                    type: 'DATE',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT.id
                },
                FORMA_PAGO: {
                    id: 'custpage_fld_forma_pago',
                    alias: 'formaPago',
                    label: 'Forma de Pago',
                    type: 'SELECT',
                    container: this.FORMS.PAGOS_GLOBALES.FIELD_GROUPS.GLOBAL_PAYMENT.id
                }
            };

            this.FORMS.PAGOS_GLOBALES.LINE_FIELDS = {
                INTERNALID: {
                    id: 'custpage_column_invc_internalid',
                    alias: 'internalId',
                    label: 'Internal ID',
                    type: 'TEXT'
                },
                TRAN_ID: {
                    id: 'custpage_column_invc_tranid',
                    alias: 'tranId',
                    label: 'No. de Factura',
                    type: 'TEXT'
                },
                TRAN_DATE: {
                    id: 'custpage_column_invc_trandate',
                    alias: 'tranDate',
                    label: 'Fecha',
                    type: 'TEXT'
                },
                CURRENCY: {
                    id: 'custpage_column_invc_currency',
                    alias: 'currency',
                    label: 'Moneda',
                    type: 'TEXT'
                },
                TOTAL: {
                    id: 'custpage_column_invc_total',
                    alias: 'total',
                    label: 'Importe Total',
                    type: 'CURRENCY'
                },
                DUE_AMOUNT: {
                    id: 'custpage_column_invc_no_due_amount',
                    alias: 'dueAmount',
                    label: 'Importe Adeudado',
                    type: 'CURRENCY'
                },
                TOTAL_PAYMENT: {
                    id: 'custpage_column_invc_total_payment',
                    alias: 'totalPayment',
                    label: 'Importe a Pagar',
                    type: 'CURRENCY'
                }
            };

        }

        get forms() { return this.FORMS; }
    }

    const getConfiguration = () => {

        return new configuration();
    };

    return { getConfiguration }
});