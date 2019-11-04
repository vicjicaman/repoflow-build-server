import path from "path";
import _ from "lodash";
import { retry, wait } from "@nebulario/core-process";
import * as Operation from "./operation";
import * as Repository from "./repository";
const uuidv4 = require("uuid/v4");

export const register = (app, type, handler, cxt) => {
  cxt.logger.debug("register.build.routes", { type });

  app.post("/types/" + type + "/deploy/status", async (req, res) => {
    try {
      const params = req.body;
      const { operationid, version, fullname } = params;
      const key = fullname + "/" + version;

      cxt.logger.debug("deploy.status.route.request", { type, params });

      const { repositoryid } = await Repository.init(
        params,
        {
          type
        },
        cxt
      );

      const output = await handler.status(repositoryid, params, cxt);

      cxt.logger.debug("deploy.status.route.response", {
        operationid,
        deployment: output
      });

      res.json({
        output: {
          deployment: output
        },
        error: null
      });
    } catch (e) {
      res.json({
        output: null,
        error: e.toString()
      });
    } finally {
      res.end();
    }
  });

  app.post("/types/" + type + "/deploy/start", async (req, res) => {
    try {
      const params = req.body;
      const { operationid: extOperationid, version, fullname } = params;
      const key = fullname + "/" + version;

      cxt.logger.debug("build.route.request", { params });

      let buildOp = Operation.get(extOperationid);

      if (!buildOp) {
        buildOp = Operation.start(
          key,
          async (params, cxt) => {
            const { repositoryid } = await Repository.init(
              params,
              {
                type
              },
              cxt
            );

            const res = await handler.deploy(repositoryid, params, cxt);
            return res;
          },
          params,
          cxt
        );
      }

      const { operationid, status, result, error } = buildOp;

      cxt.logger.debug("deploy.route.request.start", {
        operationid,
        status,
        result,
        error
      });

      res.json({
        output: { operationid, status, result },
        error
      });
    } catch (e) {
      res.json({
        output: null,
        error: e.toString()
      });
    } finally {
      res.end();
    }
  });
};
