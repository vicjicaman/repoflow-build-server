import path from "path";
import _ from "lodash";
import * as PublishRoutes from "../utils/publish";
import { exec, retry, wait } from "@nebulario/core-process";

const status = async (repositoryid, { fullname, version }, cxt) => {
  let published = false;

  const { stdout: versionsInfoString } = await cxt.exec(
    ["yarn info " + fullname + " versions --json"],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );

  if (versionsInfoString !== "") {
    const info = JSON.parse(versionsInfoString);

    if (info.data.includes(version)) {
      published = true;
    }
  }

  return { published };
};

const build = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
  await cxt.exec(
    ["yarn install --production=false"],
    {
      cwd: repositoryid
    },
    { progress: true },
    cxt
  );

  await cxt.exec(
    ["yarn build:" + mode],
    {
      cwd: repositoryid
    },
    { progress: true },
    cxt
  );
};

const publish = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
  const isPublic = !!_.find(labels, {
    labelid: "public"
  });

  cxt.logger.info("publish.npm", { isPublic });

  if (isPublic) {
    const { published } = await status(
      repositoryid,
      { fullname, version },
      cxt
    );

    if (published) {
      await cxt.exec(
        ["npm access public " + fullname],
        {
          cwd: repositoryid
        },
        { progress: true },
        cxt
      );
    }
  }

  const out = await retry(
    async i =>
      await cxt.exec(
        [
          "yarn publish --ignore-scripts --network-timeout 600000 --new-version=" +
            version +
            (isPublic ? " --access public " : "")
        ],
        {
          cwd: repositoryid
        },
        { progress: true },
        cxt
      ),
    (re, i, time) => {
      cxt.logger.error("publish.npm.error", { error: re.stderr });
      if (
        re.code === 1 &&
        (re.stderr.includes("socket hang up") ||
          re.stderr.includes("EHOSTUNREACH") ||
          re.stderr.includes("ETIMEDOUT"))
      ) {
        return true;
      } else {
        return false;
      }
    },
    5
  );
};

export const routes = (app, cxt) =>
  PublishRoutes.register(
    app,
    "npm",
    {
      status,
      build,
      publish
    },
    cxt
  );
