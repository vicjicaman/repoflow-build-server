import path from 'path'
import {exec} from '@nebulario/core-process';
import * as Repository from '../utils/repository'

export const type = "compose";
export const routes = async (app, cxt) => {
  console.log("Register compose test routes");

  app.post('/build/compose', async (req, res) => {
    console.log("Build request compose!");
    console.log(JSON.stringify(req.body, null, 2));

    try {

      const params = req.body;
      const {moduleid, mode, version, fullname} = params;

      const {folder: repositoryFolder} = await Repository.init(params, {
        type
      }, cxt);

      console.log("TAG WITH VERSION");
      const {stdout: tagout} = await exec(['git tag v' + version], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log(tagout);

      const {stdout: pushout} = await exec(['git push origin v' + version], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log(pushout);
      console.log("FINISH PUBLISH");
      await wait(2500); // Wait for package propagation

      const repository = await Repository.publish(params, {
        folder: repositoryFolder
      }, cxt);

      res.json({success: true, message: "compose published"});
    } catch (e) {
      res.json({error: e.toString()});
    } finally {
      res.end();
    }
  });
}
