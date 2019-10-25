require("dotenv").config();
import path from "path";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import { createNode } from "@nebulario/core-node";
import { Logger } from "@nebulario/core-logger";
import { exec as coreExec } from "@nebulario/core-process";

import * as HandlerNPM from "./npm";
import * as HandlerContainerNPM from "./container";
import * as HandlerCompose from "./compose";
import * as HandlerBundle from "./bundle";
import * as HandlerConfig from "./config";
import * as HandlerSite from "./site";
import * as HandlerRealm from "./realm";

//console.log(JSON.stringify(process.env, null, 2));

const service_port = process.env.SERVICE_PORT || 8000;
const workspace = path.join(process.env.REPOFLOW_WORKSPACE, "build");
const env = process.env.NODE_ENV;

//console.log("REPOFLOW_WORKSPACE: " + process.env.REPOFLOW_WORKSPACE);
//console.log(workspace);

const name = "build-server";
const logPath = path.join(workspace, "logs");
//console.log(logPath)
const logger = Logger({ path: logPath, env });
const cxt = {
  workspace,
  logger,
  exec: async (cmds, opts, hdls, cxt) => {
    try {
      const out = await coreExec(cmds, opts, hdls, cxt);

      cxt.logger.debug("exec.cmd.output", {
        cmds,
        opts,
        output: out.stdout,
        warning: out.stderr
      });

      return out;
    } catch (e) {
      cxt.logger.error("exec.cmd.error", { cmds, error: e.toString(), opts });
      throw e;
    }
  }
};

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
HandlerSite.routes(app, cxt);
HandlerRealm.routes(app, cxt);

const server = app.listen(service_port);
console.log("Running server at " + service_port);
