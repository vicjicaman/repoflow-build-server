import path from "path";
import _ from "lodash";
const uuidv4 = require("uuid/v4");

const OPERATION_KEY_INDEX = {};
const OPERATION_DATA = {};

export const get = operationid => OPERATION_DATA[operationid] || null;
export const getByKey = key => get(OPERATION_KEY_INDEX[key]);

export const start = (key, handler, params, cxt) => {
  let operation = getByKey(key);
  if (operation) {
    return operation;
  }

  const operationid = uuidv4();

  cxt.logger.debug("operation.start", { key, operationid });

  operation = {
    operationid,
    key,
    status: "running",
    error: null,
    data: {},
    promise: null
  };
  OPERATION_KEY_INDEX[key] = operationid;
  OPERATION_DATA[operationid] = operation;

  operation.promise = handler(params, { ...cxt, operation });
  operation.promise
    .then(result => {
      operation.result = result;
    })
    .catch(e => {
      operation.error = e;
      cxt.logger.error("operation.error", {
        operationid,
        key,
        error: e.toString()
      });
    })
    .finally(() => {
      operation.status = "stop";
      delete OPERATION_KEY_INDEX[key];
      delete OPERATION_DATA[operationid];
    });

  return operation;
};
