require("dotenv").config();
import path from "path";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import { createNode } from "@nebulario/core-node";
import { Logger } from "@nebulario/core-logger";
import { exec as coreExec } from "@nebulario/core-process";
import * as JsonUtils from "@nebulario/core-json";

import * as HandlerNPM from "./npm";
import * as HandlerContainerNPM from "./container";
import * as HandlerCompose from "./compose";
import * as HandlerBundle from "./bundle";
import * as HandlerConfig from "./config";
import * as HandlerFolder from "./folder";
import * as HandlerScript from "./script";
import * as HandlerSite from "./site";
import * as HandlerRealm from "./realm";

const service_port = process.env.SERVICE_PORT || 8000;
const workspace = path.join(process.env.REPOFLOW_WORKSPACE, "build");
const env = process.env.NODE_ENV;

const name = "build-server";
const logger = Logger({ path: path.join(workspace, "logs"), env });

logger.info("env", { cwd: process.cwd(), pid: process.pid });

const cxt = {
  workspace,
  logger,
  exec: async (cmds, opts, hdls, cxt) => {
    try {
      const out = await coreExec(cmds, opts, hdls, cxt);

      const payload = {
        cmds,
        opts,
        output: out.stdout,
        warning: out.stderr
      };

      if (hdls.progress === true) {
        cxt.logger.info("exec.cmd.output", payload);
      } else {
        cxt.logger.debug("exec.cmd.output", payload);
      }

      return out;
    } catch (e) {
      cxt.logger.debug("exec.cmd.error", { cmds, error: e.toString(), opts });
      throw e;
    }
  },
  config: {}
};

const configPath = path.join(workspace, "config.json");
if (fs.existsSync(configPath)) {
  cxt.config = JsonUtils.load(configPath);
}

cxt.logger.debug("service", {
  workspace,
  config: cxt.config
});

const app = createNode(
  {
    name
  },
  { logger }
);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

HandlerNPM.routes(app, cxt);
HandlerContainerNPM.routes(app, cxt);
HandlerCompose.routes(app, cxt);
HandlerBundle.routes(app, cxt);
HandlerConfig.routes(app, cxt);
HandlerFolder.routes(app, cxt);
HandlerScript.routes(app, cxt);
HandlerSite.routes(app, cxt);
HandlerRealm.routes(app, cxt);

const server = app.listen(service_port);
cxt.logger.debug("service.running", {
  port: service_port
});
