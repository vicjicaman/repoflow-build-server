import path from "path";
import _ from "lodash";
import { retry, wait } from "@nebulario/core-process";
import * as Operation from "./operation";
import * as Repository from "./repository";
const uuidv4 = require("uuid/v4");

export const register = (app, type, handler, cxt) => {
  cxt.logger.debug("register.build.routes", { type });

  app.post("/types/" + type + "/publish/status", async (req, res) => {
    try {
      const params = req.body;
      const { operationid, version, fullname } = params;
      const key = fullname + "/" + version;

      cxt.logger.debug("publish.status.route.request", { type, params });

      const { repositoryid } = await Repository.init(
        params,
        {
          type,
          mode: "publish"
        },
        cxt
      );

      const output = await handler.status(repositoryid, params, cxt);

      const repstatus = await Repository.status(
        params,
        {
          repositoryid
        },
        cxt
      );

      cxt.logger.debug("publish.status.route.response", {
        operationid,
        deliverable: output,
        repository: repstatus
      });

      res.json({
        output: {
          deliverable: output,
          repository: repstatus
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

  app.post("/types/" + type + "/publish/start", async (req, res) => {
    try {
      const params = req.body;
      const { operationid: extOperationid, version, fullname } = params;
      const key = type + "/" + fullname + "/" + version;

      cxt.logger.debug("build.route.request", { params });

      let buildOp = Operation.getByKey(key);

      if (!buildOp) {
        buildOp = Operation.start(
          key,
          async (params, cxt) => {
            const { repositoryid } = await Repository.init(
              params,
              {
                type,
                mode: "publish"
              },
              cxt
            );

            await handler.build(repositoryid, params, cxt);

            const res = await handler.publish(repositoryid, params, cxt);

            await Repository.publish(
              params,
              {
                repositoryid
              },
              cxt
            );

            return res;
          },
          params,
          cxt
        );
      }

      const { operationid, status, result, error } = buildOp;

      cxt.logger.debug("build.route.request.status", {
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
