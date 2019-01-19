import path from 'path'
import * as Repository from '../utils/repository'
import {exec, retry, wait} from '@nebulario/core-process';

export const type = "npm";
export const routes = async (app, cxt) => {
  console.log("Register npm routes");

  app.post('/build/npm', async (req, res) => {
    console.log("Build request npm!");
    console.log(JSON.stringify(req.body, null, 2));

    try {
      //res.writeHead(200, {'Content-Type': 'text/plain'});
      const params = req.body;

      const {moduleid, mode, version, fullname, artifactid} = params;

      const {folder: repositoryFolder} = await Repository.init(params, {
        type
      }, cxt);

      let ready = true;
      try {

        const {stdout: versionsInfoString} = await exec(['yarn info ' + fullname + ' versions --json'], {
          cwd: repositoryFolder
        }, {}, cxt);
        const info = JSON.parse(versionsInfoString);

        if (info.data.includes(version)) {
          ready = false;
        }
      } catch (e) {}

      if (!ready) {
        console.log("ALREADY PUBLISHED");
        return;
      }

      console.log("NPM INSTALL");
      console.log('yarn install --production=false');
      await exec(['yarn install --production=false'], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("NPM BUILD");
      console.log('yarn build:' + mode);
      const buildOut = await exec(['yarn build:' + mode], {
        cwd: repositoryFolder
      }, {}, cxt);

      console.log("START BUILD");
      console.log(buildOut.stdout);
      console.log(buildOut.stderr);
      console.log("FINISH BUILD");

      console.log("NPM PUBLISHED");
      const out = await retry(async i => await exec(['yarn publish --ignore-scripts --new-version=' + version], {
        cwd: repositoryFolder
      }, {}, cxt), (re, i, time) => {

        console.log("NPM FAILED PUBLISH");
        console.log(re.stdout);
        console.log(re.stderr);

        if (re.code === 1 && (re.stderr.includes("socket hang up") || re.stderr.includes("EHOSTUNREACH") || re.stderr.includes("ETIMEDOUT"))) {
          return true;
        } else {
          return false;
        }

      }, 5);

      console.log("NPM PACKAGE PUBLISHED");
      await wait(2500); // Wait for package propagation

      // generate the artifact branch, this branch is expected to be merged into master in order to continue the flow
      await Repository.artifactid(params, {
        folder: repositoryFolder
      }, cxt);

      console.log("START PUBLISH");
      console.log(out.stdout);
      console.log(out.stderr);
      console.log("FINISH PUBLISH");

      res.json({success: true, message: "NPM package published"});
    } catch (e) {
      res.json({error: e.toString()});
    } finally {
      res.end();
    }
  });

}
