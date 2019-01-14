import path from 'path'
import {exec, retry, wait} from '@nebulario/core-process';

export const init = async ({
  keyPath,
  moduleid,
  url,
  branchid,
  commitid
}, {
  type
}, cxt) => {

  const {workspace} = cxt;
  const folder = path.join(workspace, type, keyPath, moduleid);
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

  return {folder: repositoryFolder};
}
