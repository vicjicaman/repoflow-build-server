import path from 'path'
import * as Repository from '../utils/repository'
import {
  exec,
  retry,
  wait
} from '@nebulario/core-process';
import * as Cluster from '../utils/cluster'
import * as Config from '@nebulario/core-config';
import * as JsonUtils from '@nebulario/core-json'


export const type = "stateful";
export const routes = async (app, cxt) => {
  console.log("Register stateful routes");

  app.post('/build/stateful', async (req, res) => {
    console.log("Build request stateful!");
    console.log(JSON.stringify(req.body, null, 2));

    try {
      const params = req.body;

      const {
        moduleid,
        mode,
        version,
        fullname
      } = params;

      const {
        folder: repositoryFolder
      } = await Repository.init(params, {
        type
      }, cxt);

      await Config.init(folder);
      Config.build(folder);

      Cluster.config(folder, "service.yaml");
      Cluster.config(folder, "stateful.yaml");

      const repository = await Repository.publish(params, {
        folder: repositoryFolder
      }, cxt);


      res.json({
        success: true,
        message: "Service repository published."
      });
    } catch (e) {
      console.log("ERROR:" + e.toString());

      res.json({
        error: e.toString()
      });
    } finally {
      res.end();
    }
  });

}
