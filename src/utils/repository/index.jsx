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
