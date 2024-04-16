/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        class invoice {

            constructor({ internalId, tranId, location, entity, currency, tranDate, total, amountRemaining, eDocumentTemplate, eDocumentSendingMethod }) {

                this._internalId = internalId || '';
                this._tranId = tranId || '';
                this._location = location || '';
                this._currency = currency || '';
                this._entity = entity || '';
                this._tranDate = tranDate || '';
                this._total = total || '';
                this._amountRemaining = amountRemaining || '';
                this._eDocumentTemplate = eDocumentTemplate || '';
                this._eDocumentSendingMethod = eDocumentSendingMethod || '';
            }
        }

        class facturaGlobal {

            constructor({ internalId, tranId, entity, currency, tranDate, transaccionesGlb, cfdiUsage, satPaymentMethod }) {

                this._internalId = internalId || '';
                this._tranId = tranId || '';
                this._entity = entity || '';
                this._currency = currency || '';
                this._tranDate = tranDate || '';
                this._transaccionesGlb = transaccionesGlb || '';
                this._cfdiUsage = cfdiUsage || '';
                this._satPaymentMethod = satPaymentMethod || '';
            }
        }

        class pagoGlobal {

            constructor({ internalId, name, cliente, fecha, facturaConsolidada, pagoClienteGlobal, cuenta, moneda, metodoPago, formaPago,
                usoCfdi, prorrateoPago, facturas }) {

                this._internalId = internalId || '';
                this._name = name || '';
                this._cliente = cliente || '';
                this._fecha = fecha || '';
                this._facturaConsolidada = facturaConsolidada || '';
                this._pagoClienteGlobal = pagoClienteGlobal || '';
                this._cuenta = cuenta || '';
                this._moneda = moneda || '';
                this._metodoPago = metodoPago || '';
                this._usoCfdi = usoCfdi || '';
                this._formaPago = formaPago || '';
                this._prorrateoPago = prorrateoPago || '';
                this._facturas = facturas || '';
            }
        }

        class configuracionPagoGlobal {

            constructor({ cpEDocumentTemplate, cpEDocumentSendingMethod }) {

                this._cpEDocumentTemplate = cpEDocumentTemplate || '';
                this._cpEDocumentSendingMethod = cpEDocumentSendingMethod || '';
            }
        }

        return {
            invoice(data) { return new invoice(data); },
            facturaGlobal(data) { return new facturaGlobal(data); },
            pagoGlobal(data) { return new pagoGlobal(data); },
            configuracionPagoGlobal(data) { return new configuracionPagoGlobal(data); }
        }
    });