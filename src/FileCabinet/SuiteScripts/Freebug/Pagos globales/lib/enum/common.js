/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        const texts = () => {
            return {
                CANT_PROCESS_REQUEST: 'No fue posible procesar la petición',
                MISSING_REQUIRED_PARAMETER: 'Parámetro requerido faltante',
            }
        }

        const constants = () => {
            return {
                APPROVAL_STATUS_APPROVED: 2,
                OBJECT_TYPE_SEARCH_RESULT: 'SEARCH_RESULT',
                OBJECT_TYPE_RECORD: 'RECORD',
                OBJECT_TYPE_REQUEST: 'REQUEST',
                OBJECT_TYPE_LOOKUP_FIELDS: 'LOOKUP_FIELDS'
            }
        }

        const getValuesFromObject = ({ objectType, fieldType, fieldId, object }) => {

            this.text = '';
            this.value = '';

            try {

                objectTypeValidation: {

                    switch (objectType) {
                        case constants().OBJECT_TYPE_SEARCH_RESULT:
                            value = object.getValue({ name: fieldId });
                            break;
                        case constants().OBJECT_TYPE_LOOKUP_FIELDS:

                            if (!object.hasOwnProperty(fieldId) && object[fieldId]) {
                                break;
                            }

                            if ('object' === typeof object[fieldId]) {
                                if (0 < object[fieldId].length) {
                                    value = object[fieldId][0].value;
                                }
                            } else {
                                value = object[fieldId];
                            }

                            break;
                        case constants().OBJECT_TYPE_RECORD:
                        case constants().OBJECT_TYPE_REQUEST:
                            value = object.getValue({ fieldId: fieldId });
                            break;
                    }

                    if (!value) {
                        break objectTypeValidation;
                    }

                    switch (fieldType) {
                        case 'SELECT':

                            value = Number(value);

                            if (objectType === constants().OBJECT_TYPE_SEARCH_RESULT) {
                                text = object.getText({ name: fieldId });
                            } else if (objectType === constants().OBJECT_TYPE_LOOKUP_FIELDS) {

                                if ('object' === typeof object[fieldId] && 0 < object[fieldId].length) {
                                    if (0 < object[fieldId].length) {
                                        text = object[fieldId][0].text;
                                    }
                                } else {
                                    text = object[fieldId];
                                }
                            } else {
                                text = object.getText({ fieldId: fieldId });
                            }

                            break;
                        case 'DATE':
                            if (objectType === constants().OBJECT_TYPE_SEARCH_RESULT) {
                                text = object.getText({ name: fieldId });
                            } else if (objectType === constants().OBJECT_TYPE_LOOKUP_FIELDS) {
                                text = object[fieldId];
                            } else {
                                text = object.getText({ fieldId: fieldId });
                            }
                            break;
                        case 'INTEGER':
                            value = Number(value);
                            text = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            break;
                        case 'FLOAT': case 'DECIMAL':
                            value = Number(Number(value).toFixed(2));
                            text = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            break;
                        case 'CURRENCY':
                            value = Number(Number(value).toFixed(2));
                            text = '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            break;
                        case 'PERCENT':
                            text = value;
                            value = Number(value.toString().replaceAll('%', ''));
                    }

                }

            } catch (error) {
                throw error;
            }

            return { text, value };
        }

        const getSublistValues = ({ recordObjType, sublistId, sublistColumns, recordObj }) => {
            try {

                let SUBLIST_COUNT_ROWS;

                switch (recordObjType) {
                    case constants().OBJECT_TYPE_REQUEST:

                        SUBLIST_COUNT_ROWS = recordObj.getLineCount({ group: sublistId });
                        break;
                    case constants().OBJECT_TYPE_RECORD:
                    default:
                        SUBLIST_COUNT_ROWS = recordObj.getLineCount({ sublistId: sublistId });
                        break;
                }

                let sublistValues = [], rowIndex = 0;

                while (rowIndex < SUBLIST_COUNT_ROWS) {

                    switch (recordObjType) {
                        case constants().OBJECT_TYPE_REQUEST:

                            sublistValues.push(Object.fromEntries(sublistColumns.map(column => {
                                return [column.id, recordObj.getSublistValue({
                                    group: sublistId,
                                    name: column.id,
                                    line: rowIndex
                                })];
                            })));

                            break;
                        case constants().OBJECT_TYPE_RECORD:
                        default:

                            sublistValues.push(Object.fromEntries(sublistColumns.map(column => {
                                return [column.id, recordObj.getSublistValue({
                                    sublistId: sublistId,
                                    fieldId: column.id,
                                    line: rowIndex
                                })];
                            })));

                            break;
                    }

                    rowIndex++;
                }

                return sublistValues;
            } catch (error) {
                throw error;
            }
        }

        return {
            texts, constants, getValuesFromObject, getSublistValues
        }
    });