import path from 'path'
import * as Repository from '../utils/repository'
import {
  exec,
  retry,
  wait
} from '@nebulario/core-process';

export const type = "bundle";
export const routes = async (app, cxt) => {
  console.log("Register bundle routes");

  app.post('/build/bundle', async (req, res) => {
    console.log("Build request bundle!");
    console.log(JSON.stringify(req.body, null, 2));

    try {
      //res.writeHead(200, {'Content-Type': 'text/plain'});
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


      console.log("NPM INSTALL");
      console.log('yarn install --production=false');
      await exec(['yarn install --production=false'], {
        cwd: repositoryFolder
      }, {}, cxt);


      const repository = await Repository.publish(params, {
        folder: repositoryFolder
      }, cxt);

      console.log("FINISH PUBLISH");

      res.json({
        success: true,
        message: "NPM package published"
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
