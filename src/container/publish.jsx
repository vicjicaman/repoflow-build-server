import path from "path";
import _ from "lodash";
import * as PublishRoutes from "../utils/publish";
import * as JsonUtils from "@nebulario/core-json";
import * as Repository from "@nebulario/core-repository";
import { exec, retry, wait } from "@nebulario/core-process";

const status = async (repositoryid, { fullname, version }, cxt) => {
  let published = false;

  try {
    await cxt.exec(
      [
        `DOCKER_CLI_EXPERIMENTAL=enabled docker manifest inspect ${fullname}:${version}`
      ],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    published = true;
  } catch (e) {
    published = false;
    cxt.logger.debug("container.status.manifest", { error: e.toString() });
  }

  return { published };
};

const build = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
  /**/

  const containerDistFolder = path.join(repositoryid, "dist");
  await cxt.exec([`mkdir -p ${containerDistFolder}`], {}, {}, cxt);

  const sourceContent = JsonUtils.load(
    path.join(repositoryid, "container.json")
  );
  const { source } = sourceContent;


  if (source.type === "npm") {
    const packageJson = {
      dependencies: {
        [source.fullname]: source.version
      }
    };
    JsonUtils.save(path.join(containerDistFolder, "package.json"), packageJson);

    await cxt.exec(
      ["yarn install --ignore-scripts --production=true"],
      {
        cwd: containerDistFolder
      },
      {},
      cxt
    );
  }

  if (source.type === "folder") {

    try {
      await Repository.clone(source.fullname, containerDistFolder);
    } catch (e) {
      const estr = e.toString();
      cxt.logger.error("container.build.error", { error: e.toString() });
      if (!estr.includes("already exists and is not an empty directory")) {
        throw e;
      }
    }

    await Repository.checkout(containerDistFolder, source.version);
  }

  // --no-cache
  await exec(
    [
      "docker build -t " +
        fullname +
        ":" +
        version +
        "  --build-arg CACHEBUST=$(date +%s) . "
    ],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );
};

const publish = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
  const isAWS = !!_.find(labels, {
    labelid: "aws"
  });

  if (isAWS) {
    const awsout = await exec(
      ["aws ecr get-login --no-include-email --region us-east-1"],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    await exec(
      [awsout.stdout],
      {
        cwd: repositoryid
      },
      {},
      cxt
    );

    try {
      const checkout = await exec(
        ["aws ecr list-images --repository-name " + moduleid],
        {
          cwd: repositoryid
        },
        {},
        cxt
      );
    } catch (e) {
      if (e.message.includes("does not exist in the registry with id")) {
        await exec(
          ["aws ecr create-repository --repository-name " + moduleid],
          {
            cwd: repositoryid
          },
          {},
          cxt
        );
      } else {
        throw e;
      }
    }
  }

  await exec(
    ["docker push " + fullname + ":" + version],
    {
      cwd: repositoryid
    },
    {},
    cxt
  );
};

export const routes = (app, cxt) =>
  PublishRoutes.register(
    app,
    "container",
    {
      status,
      build,
      publish
    },
    cxt
  );
