import path from 'path'
import _ from 'lodash'
import {
  exec,
  retry,
  wait
} from '@nebulario/core-process';

export const init = async ({
  folder: relativeFolder,
  moduleid,
  url,
  branchid
}, {
  type
}, cxt) => {

  const {
    workspace
  } = cxt;
  const folder = path.join(workspace, type, relativeFolder, moduleid);
  const repositoryFolder = path.join(folder, "repository");

  try {
    await exec(['rm -R ' + folder], {}, {}, cxt);
  } catch (e) {}

  await exec(['mkdir -p ' + folder], {}, {}, cxt);
  console.log("FOLDER: " + folder);

  await exec(['git clone git@' + url + " " + repositoryFolder], {}, {}, cxt);

  await exec(['git fetch origin -- ' + branchid], {
    cwd: repositoryFolder
  }, {}, cxt);

  await exec(['git checkout ' + branchid], {
    cwd: repositoryFolder
  }, {}, cxt);

  return {
    folder: repositoryFolder
  };
}

export const publish = async ({
  branchid,
  version
}, {
  folder: repositoryFolder
}, cxt) => {


  console.log("ADD ARTIFACT CHANGES");
  const {
    stdout: status
  } = await exec(['git status --porcelain'], {
    cwd: repositoryFolder
  }, {}, cxt);

  if (status !== "") {

    console.log("ADD ARTIFACT CHANGES");
    await exec(['git add .'], {
      cwd: repositoryFolder
    }, {}, cxt);

    console.log("COMMIT ARTIFACT CHANGES");
    await exec(['git commit -m "Publish modifications"'], {
      cwd: repositoryFolder
    }, {}, cxt);

    console.log("PUSH CHANGES");
    await exec(['git push --set-upstream origin ' + branchid], {
      cwd: repositoryFolder
    }, {}, cxt);

  }


  const {
    stdout: tagList
  } = await exec(['git tag --list'], {
    cwd: repositoryFolder
  }, {}, cxt);

  const tags = _.map(tagList.split("\n"), tag => tag.trim());

  if (!tags.includes("v"+version)) {
    console.log("TAG WITH VERSION");
    const {
      stdout: tagout
    } = await exec(['git tag v' + version], {
      cwd: repositoryFolder
    }, {}, cxt);

    console.log(tagout);

    const {
      stdout: pushout
    } = await exec(['git push origin v' + version], {
      cwd: repositoryFolder
    }, {}, cxt);
    console.log(pushout);
  }



  console.log("FINISH PUBLISH TAG TO REPOSITORY");
  //await wait(100); //wait(2500); // Wait for package propagation




  return true;

}
