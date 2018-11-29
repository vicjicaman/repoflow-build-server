import path from 'path'
import {exec, retry, wait} from '@nebulario/core-process';
//const {exec} = require('child_process');

const publish = async ({
  module: {
    moduleid,
    mode,
    version,
    fullname,
    repository: {
      url,
      commitid
    },
    iteration: {
      iterationid,
      feature: {
        featureid,
        repository: {
          baselineid,
          branchid
        }
      }
    }
  }
}, res, cxt) => {

  const {workspace} = cxt;
  const folder = path.join(workspace, 'features', featureid, 'iterations', iterationid.toString(), 'modules', moduleid);
  const repositoryFolder = path.join(folder, "repository");

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

  try {
    await exec(['rm -R ' + folder], {}, {}, cxt);
  } catch (e) {}

  await exec(['mkdir -p ' + folder], {}, {}, cxt);
  await exec(['git clone git@' + url + " " + repositoryFolder], {}, {}, cxt);

  await exec(['git fetch origin -- ' + branchid], {
    cwd: repositoryFolder
  }, {}, cxt);

  await exec(['git checkout ' + commitid], {
    cwd: repositoryFolder
  }, {}, cxt);
  const modeInstall = mode === "prod"
    ? "--prod"
    : "";

  await exec(['yarn install'], {
    cwd: repositoryFolder
  }, {}, cxt);

  const cmdout = await exec(['yarn build:' + mode], {
    cwd: repositoryFolder
  }, {}, cxt);

  const out = await retry(async i => await exec(['yarn publish --new-version=' + version], {
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
  await wait(2000);

  console.log("START PUBLISH");
  console.log(out.stdout);
  console.log(out.stderr);
  console.log("FINISH PUBLISH");

}

export const routes = async (app, cxt) => {
  console.log("Register npm routes");

  app.get('/build/test/npm', async (req, res) => {

    const params = JSON.parse(` {
      "module" : {
        "moduleid": "core-process",
        "mode": "dev",
        "version": "1.0.1-local-ui-graph-manually",
        "type": "npm",
        "fullname": "@nebulario/core-process",
        "repository": {
          "url": "github.com:vicjicaman/core-process.git",
          "commitid": "27a249c8ac36a0134e6129f7d3ed027794aa2c46",
          "message": "Sync to the latest iteration version"
        },
        "release": true,
        "id": "repoflow.com_local-ui-graph_15_core-process",
        "iteration": {
          "iterationid": 15,
          "feature": {
            "featureid": "local-ui-graph",
            "repository": {
              "baselineid": "master",
              "branchid": "local-ui-graph/master",
              "instance": {
                "instanceid": "local-ui-graph-master",
                "namespaceid": {
                  "namespaceid": "repoflow.com"
                }
              }
            }
          }
        }
      }
    }`);

    try {
      await publish(params, cxt);

      res.json({message: "NPM published"});
    } catch (e) {
      res.json({error: e.toString()});
    }

  });

  // TEsting dthe deivce
  // Check the device is overloaded now
  app.post('/build/npm', async (req, res) => {
    console.log("Build request npm!");
    console.log(JSON.stringify(req.body, null, 2));

    try {

      res.writeHead(200, {'Content-Type': 'text/plain'});

      res.write("START NPM PUBLISH");
      await wait(2000);
      res.write("1 NPM PUBLISH");
      await wait(2000);
      res.write("2 NPM PUBLISH");
      await wait(2000);
      res.write("3 NPM PUBLISH");
      await wait(2000);
      res.write("4 NPM PUBLISH");
      await wait(2000);

      await publish(req.body, res, cxt);

      //res.json({success: true, message: "NPM package published"});
    } finally {
      res.end();
    }/*catch (e) {
      //res.json({error: e.toString()});
    }*/
  });
}
