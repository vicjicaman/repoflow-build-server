import path from 'path'
import {exec, retry, wait} from '@nebulario/core-process';

export const init = async ({
  folder: relativeFolder,
  moduleid,
  url,
  branchid,
  commitid
}, {
  type
}, cxt) => {

  const {workspace} = cxt;
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

  await exec(['git checkout ' + commitid], {
    cwd: repositoryFolder
  }, {}, cxt);

  return {folder: repositoryFolder};
}

export const artifact = async ({
  artifactid
}, {
  folder: repositoryFolder
}, cxt) => {

  console.log("ADD ARTIFACT CHANGES");
  const {stdout: status} = await exec(['git status --porcelain'], {
    cwd: repositoryFolder
  }, {}, cxt);

  if (status === "") {
    return false;
  }

  console.log("ADD ARTIFACT CHANGES");
  await exec(['git add .'], {
    cwd: repositoryFolder
  }, {}, cxt);

  console.log("GENERATE ARTIFACT CHANGES");
  await exec(['git checkout -b ' + artifactid], {
    cwd: repositoryFolder
  }, {}, cxt);

  console.log("COMMIT ARTIFACT CHANGES");
  await exec(['git commit -m "Publish artifact modifications"'], {
    cwd: repositoryFolder
  }, {}, cxt);

  console.log("PUSH CHANGES");
  await exec(['git push --set-upstream origin ' + artifactid], {
    cwd: repositoryFolder
  }, {}, cxt);

  return true;

}
