import path from 'path'
import {exec} from '@nebulario/core-process';
import * as Repository from '../utils/repository'

export const type = "container";
export const routes = async (app, cxt) => {
  console.log("Register container test routes");

  app.post('/build/container', async (req, res) => {
    console.log("Build request container!");
    console.log(JSON.stringify(req.body, null, 2));

    try {

      const params = req.body;
      const {moduleid, mode, version, fullname} = params;

      const {folder: repositoryFolder} = await Repository.init(params, {
        type
      }, cxt);

      console.log("INSTALL APP");
      await exec(['yarn install --ignore-scripts --production=true'], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("BUILD IMAGE");
      await exec(['docker build . -t ' + fullname + ':' + version], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("LOGIN IN AWS");
      const awsout = await exec(['aws ecr get-login --no-include-email --region us-east-1'], {
        cwd: repositoryFolder
      }, {}, cxt);

      const loginout = await exec([awsout.stdout], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("CHECK REPOSITORY IMAGE");
      try {
        const checkout = await exec(['aws ecr list-images --repository-name ' + moduleid], {
          cwd: repositoryFolder
        }, {}, cxt);

      } catch (e) {

        if (e.message.includes("does not exist in the registry with id")) {

          await exec(['aws ecr create-repository --repository-name ' + moduleid], {
            cwd: repositoryFolder
          }, {}, cxt);

        } else {
          throw e;
        }

      }

      console.log("PUSH IMAGE IN REPO");
      console.log('docker push ' + fullname + ':' + version);
      const cmdout = await exec(['docker push ' + fullname + ':' + version], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("START PUBLISH");
      console.log(cmdout.stdout);
      console.log(cmdout.stderr);
      console.log("FINISH PUBLISH");

      const repository = await Repository.publish(params, {
        folder: repositoryFolder
      }, cxt);

      res.json({success: true, message: "Container published"});
    } catch (e) {
      res.json({error: e.toString()});
    } finally {
      res.end();
    }
  });
}
