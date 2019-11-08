import fs from "fs";
import path from "path";
import _ from "lodash";
import { retry, wait } from "@nebulario/core-process";

export const init = async (
  { folder: relativeFolder, moduleid, url, branchid },
  { type, mode },
  cxt
) => {
  const { workspace } = cxt;
  const folder = path.join(workspace, mode, relativeFolder);
  const repositoryid = path.join(folder, "repository");

  if (!fs.existsSync(repositoryid)) {
    await cxt.exec(["mkdir -p " + folder], {}, {}, cxt);
    cxt.logger.debug("repository.init", { url, repositoryid });

    await cxt.exec(["git clone git@" + url + " " + repositoryid], {}, {}, cxt);
  }

  await cxt.exec(
    ["git fetch origin -- " + branchid],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );

  await cxt.exec(
    ["git checkout " + branchid],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );

  return {
    repositoryid: repositoryid
  };
};

export const status = async (params, { repositoryid }, cxt) => {
  const { branchid, version } = params;
  const tag = "v" + version;

  const { stdout: tagList } = await cxt.exec(
    ["git tag --list"],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );

  const tags = _.map(tagList.split("\n"), tag => tag.trim());

  let tagged = false;
  if (tags.includes(tag)) {
    tagged = true;
  }

  return { tag, tagged };
};

export const publish = async (params, { repositoryid }, cxt) => {
  const { branchid, version } = params;

  const { stdout: fileStatus } = await cxt.exec(
    ["git status --porcelain"],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );

  if (fileStatus !== "") {
    cxt.logger.debug("repository.artifact.changes", { files: fileStatus });

    await cxt.exec(
      ["git add ."],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    await cxt.exec(
      ['git commit -m "Publish modifications"'],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    await cxt.exec(
      ["git push --set-upstream origin " + branchid],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );
  }

  const { tag, tagged } = await status(
    params,
    {
      repositoryid
    },
    cxt
  );

  if (!tagged) {
    await cxt.exec(
      ["git tag " + tag],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    await cxt.exec(
      ["git push origin " + tag],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    return true;
  } else {
    cxt.logger.debug("repository.tag.exists", {
      tag
    });
    return false;
  }
};
