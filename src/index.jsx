import path from 'path'
import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import {createNode} from "@nebulario/core-node";
import {Logger} from '@nebulario/core-logger';

import * as HandlerNPM from './npm'
import * as HandlerContainerNPM from './container'

console.log(JSON.stringify(process.env, null, 2));

const service_port = process.env.SERVICE_PORT || 8000;
const workspace = path.join(process.env.REPOFLOW_WORKSPACE || "/home/victor/workspace", "build");

const name = "build-node";
const logger = Logger({name});
const cxt = {
  workspace,
  logger
};

const app = createNode({
  name
}, {logger});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

HandlerNPM.routes(app, cxt);
HandlerContainerNPM.routes(app, cxt);

app.listen(service_port);
console.log('Running server at ' + service_port);