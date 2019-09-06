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

export const type = "service";
export const routes = async (app, cxt) => {
  console.log("Register service routes");

  app.post('/build/service', async (req, res) => {
    console.log("Build request service!");
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


      await Config.init(repositoryFolder);
      Config.build(repositoryFolder);

      Cluster.config(repositoryFolder, "service.yaml");
      Cluster.config(repositoryFolder, "deployment.yaml");

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
