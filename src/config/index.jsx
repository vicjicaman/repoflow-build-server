import path from 'path'
import * as Repository from '../utils/repository'
import {
  exec,
  retry,
  wait
} from '@nebulario/core-process';
import * as Config from '@nebulario/core-config';

export const type = "config";
export const routes = async (app, cxt) => {
  console.log("Register config routes");

  app.post('/build/config', async (req, res) => {
    console.log("Build request config!");
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


      console.log("INIT CONFIG");
      await Config.init(repositoryFolder);

      console.log("BUILD CONFIG");
      Config.build(repositoryFolder);

      const repository = await Repository.publish(params, {
        folder: repositoryFolder
      }, cxt);


      res.json({
        success: true,
        message: "Config repository published."
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
