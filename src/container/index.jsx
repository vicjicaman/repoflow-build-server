import path from 'path'
import {exec} from '@nebulario/core-process';
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
}, cxt) => {

  const {workspace} = cxt;
  const folder = path.join(workspace, 'features', featureid, 'iterations', iterationid.toString(), 'modules', moduleid);
  const repositoryFolder = path.join(folder, "repository");

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

  console.log("INSTALL APP");
  await exec(['yarn install ' + modeInstall], {
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

  console.log(awsout);

  const loginout = await exec([awsout.stdout], {
    cwd: repositoryFolder
  }, {}, cxt);

  console.log(loginout);

  console.log("CHECK REPOSITORY IMAGE");
  try {
    const checkout = await exec(['aws ecr list-images --repository-name ' + moduleid], {
      cwd: repositoryFolder
    }, {}, cxt);

    console.log(checkout);

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

}

export const routes = async (app, cxt) => {
  console.log("Register container test routes");

  app.get('/build/test/container', async (req, res) => {

    const params = JSON.parse(`{
  "module": {
    "moduleid": "repoflow-container-graph",
    "mode": "dev",
    "version": "1.1.7-local-ui-graph-dev",
    "type": "container",
    "fullname": "919446158824.dkr.ecr.us-east-1.amazonaws.com/repoflow-container-graph",
    "repository": {
      "url": "github.com:vicjicaman/repoflow-container-graph.git",
      "commitid": "b288ffb162152203663a8331e34b7eb01143b377",
      "message": "Move request error to event waiter"
    },
    "release": true,
    "id": "repoflow.com_local-ui-graph_19_repoflow-container-graph",
    "iteration": {
      "iterationid": 19,
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
  },
  "outputPath": "/home/victor/nodeflow/workspace/namespaces/repoflow.com/instances/local-ui-graph-master/plugins/iterations/19/modules/repoflow-container-graph/container"
}`);

    try {
      await publish(params, cxt);

      res.json({message: "Container published"});
    } catch (e) {
      res.json({error: e.toString()});
    }

  });

  // TEsting dthe deivce
  // Check the device is overloaded now
  app.post('/build/container', async (req, res) => {
    console.log("Build request container!");
    console.log(JSON.stringify(req.body, null, 2));

    try {
      await publish(req.body, cxt);

      res.json({success: true, message: "Container published"});
    } catch (e) {
      res.json({error: e.toString()});
    }
  });
}
