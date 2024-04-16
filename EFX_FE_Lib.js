/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/search','N/runtime'], function (search,runtime) {

    function libreriaArticulos(obj_main,recordObj,lineCount,tipo_transaccion_gbl,tipo_transaccion_gbl_tipo) {

        var articuloGrupo;
        var arrayItemCodeIds = new Array();
        var arrayItemCode = new Array();

        for(var g=0;g<lineCount;g++){
            var tipoArticulo = recordObj.getSublistValue({
                fieldId: 'itemtype',
                sublistId: 'item',
                line: g,
            });

            if (tipoArticulo === 'Subtotal') {
                continue;
            }
            if (tipoArticulo === 'EndGroup') {

                continue;
            }
            if (tipoArticulo === 'Discount') {
                continue;
            }

            var itemCodeInArray = recordObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_mx_txn_line_sat_item_code',
                line: g,
            });
            if(itemCodeInArray){
                arrayItemCodeIds.push(itemCodeInArray);
            }


        }
        log.audit({title:'arrayItemCodeIds',details:arrayItemCodeIds});


        if(arrayItemCodeIds.length >0) {
            var buscaCodigosSat = search.create({
                type: 'customrecord_mx_sat_item_code_mirror',
                filters: [['internalid', search.Operator.ANYOF, arrayItemCodeIds]],
                columns: [
                    search.createColumn({name: 'custrecord_mx_ic_mr_code'}),
                    search.createColumn({name: 'internalid'}),
                ]
            });
            buscaCodigosSat.run().each(function (result) {
                var objetolinea = {
                    internalid: '',
                    custrecord_mx_ic_mr_code: '',
                }
                objetolinea.internalid = result.getValue({name: 'internalid'}) || '';
                objetolinea.custrecord_mx_ic_mr_code = result.getValue({name: 'custrecord_mx_ic_mr_code'}) || '';
                log.audit({title: 'objetolinea', details: objetolinea});
                arrayItemCode.push(objetolinea);
                return true;
            });
            log.audit({title: 'arrayItemCode', details: arrayItemCode});

        }
        for (var a = 0; a < lineCount; a++) {
            var codigoArt = {
                itemCode: ""
            };
            var tipoArticulo = recordObj.getSublistValue({
                fieldId: 'itemtype',
                sublistId: 'item',
                line: a,
            });

            var objItem = {
                line: 0,
                discount: 0.0,
                taxDiscount: 0.0,
                whDiscountBaseAmount: 0.0,
                whDiscountTaxAmount: 0.0,
                taxes: {
                    taxItems: [],
                    whTaxItems: [],
                },
                parts: [],
                totalDiscount: 0.0,
                amtExcludeLineDiscount: 0.0,
            };

            objItem.line = a;
            objItem.type = tipoArticulo;
            var tienetaxret = recordObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_4601_witaxapplies',
                line: a,
            });
            objItem.isWhtaxApplied = tienetaxret;

            if (recordObj.type == 'itemfulfillment') {
                objItem.amount =  0.0;
                objItem.rate =  0.0;
                objItem.quantity =  0.0;
                objItem.unitsText =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitsdisplay',
                    line: a,
                });
            }else{
                objItem.amount =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: a,
                });
                objItem.rate =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: a,
                });
                objItem.quantity =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: a,
                });
            }
            
            if(tipo_transaccion_gbl && tipo_transaccion_gbl_tipo==2){
                objItem.itemId =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_efx_fe_gbl_originitem',
                    line: a,
                });
                objItem.units =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_efx_fe_gbl_originunitm',
                    line: a,
                });
            }else{
                objItem.itemId =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: a,
                });
                objItem.units =  recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    line: a,
                });
            }
            


            if (tipoArticulo === 'Subtotal') {
                continue;
            }
            if (tipoArticulo === 'EndGroup') {

                articuloGrupo.amount = recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: a,
                });

                obj_main.items.push(articuloGrupo);
                articuloGrupo = null;
                continue;
            }

            if (tipoArticulo === 'Group') {
                articuloGrupo = objItem;

                var codigoitem = recordObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_mx_txn_line_sat_item_code',
                    line: a,
                })

                for(var ac=0;ac<arrayItemCode.length;ac++){
                    if(codigoitem==arrayItemCode[ac].internalid){
                        var campos=arrayItemCode[ac].custrecord_mx_ic_mr_code;
                        codigoArt.itemCode = campos;
                    }
                }


                obj_main.satcodes.items[a]=codigoArt;


                continue;
            }
            //
            if (tipoArticulo === 'Discount') {
                continue;
            }

            var descuetoAplicado = 0;
            if (recordObj.type != 'itemfulfillment') {
                for (var i = a + 1; i < lineCount; i++) {
                    var tipoArticulo = recordObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i,
                    });
                    if (tipoArticulo !== 'Discount') {
                        break;
                    }

                    if (obj_main.isWhtaxApplied) {
                        var descuentobaseWH = recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxbaseamount',
                            line: i,
                        });
                        descuentobaseWH = descuentobaseWH || 0.0;
                        var montoDescuento = recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i,
                        });

                        objItem.whDiscountBaseAmount = objItem.whDiscountBaseAmount + Math.abs(descuentobaseWH);
                        objItem.discount = objItem.discount + Math.abs(montoDescuento);
                        objItem.taxDiscount = 0;
                    } else if (!obj_main.suiteTaxFeature) {
                        var montoDescuento = recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i,
                        });
                        var descuentoTax = recordObj.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'tax1amt',
                            line: i,
                        });
                        objItem.discount = objItem.discount + Math.abs(montoDescuento);
                        objItem.taxDiscount = objItem.taxDiscount + Math.abs(descuentoTax);
                    }
                    descuetoAplicado++;
                }
            }

            if (articuloGrupo) {
                articuloGrupo.parts.push(objItem);
            } else {
                obj_main.items.push(objItem);

            }

            var codigoitem = recordObj.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_mx_txn_line_sat_item_code',
                line: a,
            })

            // var campos = search.lookupFields({
            //     id: codigoitem,
            //     type: 'customrecord_mx_sat_item_code_mirror',
            //     columns: ['custrecord_mx_ic_mr_code'],
            // });
            for(var ac=0;ac<arrayItemCode.length;ac++){
                if(codigoitem==arrayItemCode[ac].internalid){
                    var campos=arrayItemCode[ac].custrecord_mx_ic_mr_code;
                    codigoArt.itemCode = campos;
                }
            }

            // codigoArt.itemCode = campos['custrecord_mx_ic_mr_code'];
            obj_main.satcodes.items[a]=codigoArt;
            a = a + descuetoAplicado;
        }
        return obj_main;
    }

    function tipoCFDI(tipo) {
        var tipoCFDI = {
            customsale_efx_fe_factura_global: 'I',
            invoice: 'I',
            cashsale: 'I',
            creditmemo: 'E',
            itemfulfillment: 'T',
        };
        return tipoCFDI[tipo]
    }

    function tiposImpuestosSuiteTax() {
        var filters = [];
        var columns = [];

        filters.push({
            name: 'doesnotaddtototal',
            operator: search.Operator.IS,
            values: 'T',
        });

        filters.push({
            name: 'country',
            operator: search.Operator.IS,
            values: 'MX',
        });

        columns.push({ name: 'internalid' });

        var transactionSearch = search.create({
            type: 'taxtype',
            columns: columns,
            filters: filters,
        });

        var taxcodeIDs = [];
        try {
            transactionSearch.run().each(function (result) {
                taxcodeIDs.push(result.getValue({
                    name: 'internalid',
                }));
                return true;
            });
        } catch (e) {
            if (e.name === 'SSS_INVALID_SRCH_FILTER') {
                log.debug('getSuiteTaxWithholdingTaxTypes','Old SuiteTax version. Not support Withholding Taxes.');
            } else {
                throw e;
            }
        }

        return taxcodeIDs;
    }

    // function tipoRelacionCFDI (id) {
    //
    //     var fields = search.lookupFields({
    //         id: id,
    //         type: 'customrecord_mx_sat_rel_type',
    //         columns: ['custrecord_mx_sat_rel_type_code'],
    //     });
    //
    //
    //     return fields['custrecord_mx_sat_rel_type_code'];
    // }

    function obtenMetodoPago(id){
        if (!id) {
            return;
        }

        var campos = search.lookupFields({
            id: id,
            type: 'customrecord_mx_mapper_values',
            columns: ['custrecord_mx_mapper_value_inreport', 'name'],
        });

        var objeto = {
            code: campos['custrecord_mx_mapper_value_inreport'],
            name: campos.name,
        };
        return objeto;
    }

    function obtenFormaPago(id){
        if (!id) {
            return;
        }
        var campos = search.lookupFields({
            id: id,
            type: 'customrecord_mx_sat_payment_term',
            columns: ['custrecord_mx_sat_pt_code','name'],
        });

        var objeto = {
            code: campos['custrecord_mx_sat_pt_code'],
            name : campos.name,
        };

        return objeto;

    }

    function obtenUsoCfdi(id){
        if (!id) {
            return;
        }
        var campos = search.lookupFields({
            id: id,
            type: 'customrecord_mx_sat_cfdi_usage',
            columns: ['custrecord_mx_sat_cfdi_code','name'],
        });

        var objeto = {
            code: campos['custrecord_mx_sat_cfdi_code'],
            name : campos.name,
        };
        return objeto;

    }

    function pagoData(recordObj, obj_main,sublista,id_transaccion,importeotramoneda){
        var applyCount = recordObj.getLineCount({
            sublistId: sublista,
        });

        log.debug('applyCount: ', applyCount);

        var applyData = [];
        var columnas;
        var idpag;
        var formaPago;
        var aplicado = false;

        var multi = runtime.isFeatureInEffect({feature: 'multicurrency'});
        var campoMontoId = '';
        if (multi) {
            campoMontoId = 'fx' + 'amountremaining';
        }else{
            campoMontoId = 'amountremaining';
        }

        if (sublista == 'apply') {
            columnas = [
                'custbody_mx_cfdi_uuid',
                'custbody_mx_cfdi_serie',
                'custbody_mx_cfdi_folio',
                'internalid',
                'custbody_mx_txn_sat_payment_term',
                'custbody_efx_fe_tax_json',
                'exchangerate',
                campoMontoId,
            ];
        }
        var divisas = false;
        if (multi) {
            columnas.push('currency');
            divisas=true;
        }

        var idfacturaslinea = new Array();
        var datafacturaslinea = new Array();

        for (var i = 0; i < applyCount; i++) {
            aplicado = recordObj.getSublistValue({
                fieldId: 'apply',
                sublistId: sublista,
                line: i,
            });

            if (!aplicado) {
                continue;
            }
            var poliza = recordObj.getSublistValue({
                fieldId: 'type',
                sublistId: sublista,
                line: i,
            });
            if(poliza == "Journal"){
                continue;
            }
            idfacturaslinea.push(recordObj.getSublistValue({
                fieldId: 'internalid',
                sublistId: sublista,
                line: i,
            }));
        }

        log.audit({title:'idfacturaslinea',details:idfacturaslinea});

        var buscalineasfacturas = search.create({
            type:search.Type.TRANSACTION,
            filters:[['internalid',search.Operator.ANYOF,idfacturaslinea],'AND',['mainline',search.Operator.IS,'T']],
            columns: columnas,
        });

        var fomapagoArrayIds = new Array();
        var fomapagoArray = new Array();
        var monedaArrayIds = new Array();
        var monedaArray = new Array();

        buscalineasfacturas.run().each(function(result) {
            var objetolinea = {
                custbody_mx_cfdi_uuid:'',
                custbody_mx_cfdi_serie:'',
                custbody_mx_cfdi_folio:'',
                internalid:'',
                custbody_mx_txn_sat_payment_term:'',
                currency:'',
                custbody_efx_fe_tax_json:'',
                exchangerate:''
            }
            objetolinea.custbody_mx_cfdi_uuid = result.getValue({name: 'custbody_mx_cfdi_uuid'}) || '';
            objetolinea.custbody_mx_cfdi_serie = result.getValue({name: 'custbody_mx_cfdi_serie'}) || '';
            objetolinea.custbody_mx_cfdi_folio = result.getValue({name: 'custbody_mx_cfdi_folio'}) || '';
            objetolinea.internalid = result.getValue({name: 'internalid'}) || '';
            objetolinea.custbody_mx_txn_sat_payment_term = result.getValue({name: 'custbody_mx_txn_sat_payment_term'}) || '';
            objetolinea.custbody_efx_fe_tax_json = result.getValue({name: 'custbody_efx_fe_tax_json'}) || '';
            objetolinea.exchangerate = result.getValue({name: 'exchangerate'}) || '';
            if (multi) {
                objetolinea.currency = result.getValue({name: 'currency'}) || '';
            }
            objetolinea[campoMontoId] = result.getValue({name: campoMontoId}) || 0;
            if(objetolinea[campoMontoId]=='.00'){
                objetolinea[campoMontoId]=0;
            }
            datafacturaslinea.push(objetolinea);

            if(objetolinea.custbody_mx_txn_sat_payment_term){
                fomapagoArrayIds.push(objetolinea.custbody_mx_txn_sat_payment_term);
            }
            if(objetolinea.currency){
                monedaArrayIds.push(objetolinea.currency);
            }
            return true;
        });

        log.audit({title:'fomapagoArrayIds',details:fomapagoArrayIds});
        var columnasFormaPago = [
            'custrecord_mx_sat_pt_code',
            'name',
            'internalid'
        ];
        var buscaformasPago = search.create({
            type:'customrecord_mx_sat_payment_term',
            filters:[['internalid',search.Operator.ANYOF,fomapagoArrayIds]],
            columns: columnasFormaPago,
        });

        buscaformasPago.run().each(function(result) {
            var objetolineaFpago = {
                custrecord_mx_sat_pt_code:'',
                name:'',
                internalid:''
            }
            objetolineaFpago.custrecord_mx_sat_pt_code = result.getValue({name: 'custrecord_mx_sat_pt_code'}) || '';
            objetolineaFpago.name = result.getValue({name: 'name'}) || '';
            objetolineaFpago.internalid = result.getValue({name: 'internalid'}) || '';
            fomapagoArray.push(objetolineaFpago);
            return true;
        });
        var buscaMonedas = search.create({
            type:'currency',
            filters:[['internalid',search.Operator.ANYOF,monedaArrayIds]],
            columns: ['symbol','internalid'],
        });

        buscaMonedas.run().each(function(result) {
            var objMoneda = {
                internalid:'',
                symbol:''
            }
            objMoneda.internalid = result.getValue({name: 'internalid'});
            objMoneda.symbol = result.getValue({name: 'symbol'});

            monedaArray.push(objMoneda);
            return true;
        });
        log.audit({title:'monedaArray',details:monedaArray});
        log.audit({title:'fomapagoArray',details:fomapagoArray});
        log.audit({title:'datafacturaslinea',details:datafacturaslinea});

        for (var x = 0; x < applyCount; x++) {

            aplicado = recordObj.getSublistValue({
                fieldId: 'apply',
                sublistId: sublista,
                line: x,
            });

            if (!aplicado) {
                continue;
            }
            log.audit({title:'aplicado',details:aplicado});
            var idfact = recordObj.getSublistValue({
                fieldId: 'internalid',
                sublistId: sublista,
                line: x,
            });

            log.audit({title:'idfact',details:idfact});
            for(var d=0;d<datafacturaslinea.length;d++){
                if(idfact==datafacturaslinea[d].internalid){
                    idpag = datafacturaslinea[d];

                    if (!idpag['custbody_mx_cfdi_folio']) {
                        delete idpag['custbody_mx_cfdi_folio'];
                    }
                    if (!idpag['custbody_mx_cfdi_serie']) {
                        delete idpag['custbody_mx_cfdi_serie'];
                    }

                    idpag.id = idpag.internalid;
                    formaPago = idpag['custbody_mx_txn_sat_payment_term'] ? idpag['custbody_mx_txn_sat_payment_term'] : null;

                    var obj_pay = {code:'',name:''};
                    for(var fp=0;fp<fomapagoArray.length;fp++){
                        if(fomapagoArray[fp].internalid==formaPago){
                            obj_pay = {
                                code: fomapagoArray[fp].custrecord_mx_sat_pt_code,
                                name : fomapagoArray[fp].name,
                            };
                        }
                    }
                    // var campos = search.lookupFields({
                    //     id: formaPago,
                    //     type: 'customrecord_mx_sat_payment_term',
                    //     columns: ['custrecord_mx_sat_pt_code','name'],
                    // });


                    log.audit({title:'obj_pay',details:obj_pay});

                    var code = obj_pay.code;

                    if (idpag.internalid) {
                        obj_main.satcodes.paymentTermInvMap['d' + idpag.internalid] = code;
                    }

                    obj_main.satcodes.paymentTerm = code;
                    obj_main.satcodes.paymentTermName = obj_pay.name;


                    if (idpag.currency) {

                        for(var m=0;m<monedaArray.length;m++){
                            if(monedaArray[m].internalid==idpag.currency){
                                idpag.currencysymbol = idpag.currency ? monedaArray[m].symbol : null;
                            }
                        }


                    }
                    idpag.line = x;
                    idpag.sublistId = sublista;

                    idpag.order = '';
                    idpag.amountdue = idpag[campoMontoId] ? parseFloat(idpag[campoMontoId]) : 0.0;

                    applyData.push(idpag);

                }
            }

        }
        log.audit({title:'applyData',details:applyData});
        applyData = infoPayment(applyData,id_transaccion,importeotramoneda,multi);

        return applyData;

    }

    function infoPayment(applyData,id_transaccion,importeotramoneda,multi){
        var idFacturas = new Array();

        var aplfilter = ["appliedtotransaction","anyof"];
        for(var i=0;i<applyData.length;i++){
            idFacturas.push(applyData[i].internalid);
            aplfilter.push(applyData[i].internalid);
        }

        var customerpaymentSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "CustPymt", "CustCred"],
                    "AND",
                    aplfilter,
                    "AND",
                    ["appliedtotransaction","noneof","@NONE@"]

                ],
            columns:
                [
                    search.createColumn({name: "ordertype", label: "Tipo de orden de compra"}),
                    search.createColumn({name: "mainline", label: "*"}),
                    search.createColumn({name: "trandate", label: "Fecha"}),
                    search.createColumn({name: "asofdate", label: "Fecha inicial"}),
                    search.createColumn({name: "postingperiod", label: "Período"}),
                    search.createColumn({name: "taxperiod", label: "Período fiscal"}),
                    search.createColumn({name: "type", label: "Tipo"}),
                    search.createColumn({name: "appliedtotransaction", sort: search.Sort.ASC, label: "Aplicado a la transacción"}),
                    search.createColumn({name: "trandate", sort: search.Sort.ASC, label: "Número de documento"}),
                    search.createColumn({name: "internalid", label: "Número de documento"}),
                    search.createColumn({name: "tranid", join: "appliedtotransaction", label: "Aplicado a la transacción"}),
                    search.createColumn({name: "tranid", label: "Número de documento"}),
                    search.createColumn({name: "amount", join: "appliedtotransaction", label: "Aplicado a la transacción"}),
                    search.createColumn({name: "fxamount", join: "appliedtotransaction", label: "Aplicado a la transacción FX"}),
                    search.createColumn({name: "amount", label: "Importe"}),
                    search.createColumn({name: "appliedtolinkamount", label: "Aplicado al importe de vínculo"}),
                    search.createColumn({name: "appliedtoforeignamount", label: "Aplicado al importe de vínculo FX"}),

                ]
        });

        var srchPaged = customerpaymentSearchObj.runPaged({pageSize: 1000});
        var jsontransactions = {};
        srchPaged.pageRanges.forEach(function(pageRange){
            var myPage = srchPaged.fetch({index: pageRange.index});
            myPage.data.forEach(function(result) {
                var invoiceid = result.getValue({name: "appliedtotransaction", sort: search.Sort.ASC, label: "Aplicado a la transacción"})*1;
                var paymenttranid = result.getValue({name: "tranid", label: "Número de documento"});
                var type = result.getValue({name: "type", label: "Tipo"});
                log.debug("type " +paymenttranid, type);

                if(multi){
                    var invoiceamount = result.getValue({name: "fxamount", join: "appliedtotransaction", label: "Aplicado a la transacción"});
                }else{
                    var invoiceamount = result.getValue({name: "amount", join: "appliedtotransaction", label: "Aplicado a la transacción"});
                }


                if(multi){
                    var amount = result.getValue({name: "appliedtoforeignamount", label: "Aplicado al importe de vínculo"});
                }else{
                    var amount = result.getValue({name: "appliedtolinkamount", label: "Aplicado al importe de vínculo"});
                }
                var paymentid = result.id;
                var paymenttext = result.getText({name: "appliedtotransaction", sort: search.Sort.ASC, label: "Aplicado a la transacción"});


                if(!jsontransactions[invoiceid]){
                    jsontransactions[invoiceid] = {"payments":{}};
                    jsontransactions[invoiceid]["consecutive"] = 0;
                    jsontransactions[invoiceid]["amount"] = invoiceamount;
                    jsontransactions[invoiceid]["aplicadoaFactura"] = amount;
                    jsontransactions[invoiceid]["insoluteamount"] = invoiceamount;
                    jsontransactions[invoiceid]["insoluteamount"] = invoiceamount;
                }
                
                jsontransactions[invoiceid]["id"] =invoiceid;
                if(type == 'CustPymt'){
                    jsontransactions[invoiceid]["consecutive"]++;
                    
                    if(!jsontransactions[invoiceid]["payments"][paymentid]){
                        var insolute = Math.round(jsontransactions[invoiceid]["insoluteamount"]*100)/100;
                        jsontransactions[invoiceid]["payments"][paymentid] = {"paymenttranid": paymenttranid, "paymentid": paymentid, "paymenttext": paymenttext, "consecutive": jsontransactions[invoiceid]["consecutive"], "amount": amount, "insoluteamount": insolute};
                    }
                }
                

                jsontransactions[invoiceid]["insoluteamount"] -= (amount*1 < 0)? amount *-1: amount*1;

                return true;
            });
            return true;
        });

        log.debug("reduce jsontransactions", jsontransactions);
        var paymentarray = [];
        var key = (id_transaccion+"");
        log.debug("reduce reduceContext.key", id_transaccion);

        for(var i in jsontransactions){
            //log.debug("reduce i", i);
            var invoicedata = jsontransactions[(i+"")];
            //log.debug("reduce invoicedata", invoicedata);


            var paymentdata = invoicedata.payments[key];
            //log.debug("reduce paymentdata", paymentdata);
            var paymentdatasplit = paymentdata.paymenttext.split("#");
            // log.debug("reduce paymentdatasplit", paymentdatasplit);
            var reference = paymentdatasplit[1];
            paymentarray.push({"facturaId": invoicedata.id,"facturaRef":reference,"parcialidad":paymentdata.consecutive*1,"imp":paymentdata.insoluteamount*1});
            for(var x=0;x<applyData.length;x++){
                if(applyData[x].internalid==invoicedata.id){
                    applyData[x].facturaId = invoicedata.id;
                    applyData[x].facturaRef = reference;
                    applyData[x].parcialidad = paymentdata.consecutive*1;
                    applyData[x].imp = paymentdata.insoluteamount*1;
                    applyData[x].montoFactura = invoicedata.amount;
                    applyData[x].montoAplicadoFactura = paymentdata.amount;
                }
            }
        }
        return applyData;
    }

    function summaryData(obj_main){
        var subtotalSummary = 0;
        var totalDiscountSummary = 0;
        obj_main.items.map(function (item) {
            if(item.amount){
                subtotalSummary = subtotalSummary+item.amount
            }
            if(item.totalDiscount){
                totalDiscountSummary = totalDiscountSummary+ item.totalDiscount;
            }

        });
        obj_main.summary.subtotal = subtotalSummary;
        obj_main.summary.totalDiscount = totalDiscountSummary;

        return obj_main.summary;
    }

    return {
        libreriaArticulos: libreriaArticulos,
        tipoCFDI:tipoCFDI,
        tiposImpuestosSuiteTax:tiposImpuestosSuiteTax,
        // tipoRelacionCFDI:tipoRelacionCFDI,
        obtenMetodoPago:obtenMetodoPago,
        obtenFormaPago:obtenFormaPago,
        obtenUsoCfdi:obtenUsoCfdi,
        pagoData:pagoData,
        summaryData:summaryData
    };
});