import path from "path";
import { exec, retry, wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";
import * as Config from "@nebulario/core-config";
import * as JsonUtils from "@nebulario/core-json";
import _ from "lodash";
import * as PublishRoutes from "../utils/routes";

const status = async (repositoryid, { fullname, version }, cxt) => {
  return { published: true };
};

const build = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
  await Config.init(repositoryid);
  Config.build(repositoryid);
  const values = Config.load(repositoryid);

  await Cluster.Tasks.Build.exec(
    repositoryid,
    { values },
    {
      handlers: {
        error: ({ entity: { type, file } }, error, cxt) =>
          cxt.logger.error("cluster.config.warning", {
            type,
            file,
            error: error.toString()
          })
      }
    },
    cxt
  );
};

const publish = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {};

export const routes = (app, cxt) =>
  PublishRoutes.register(
    app,
    "realm",
    {
      status,
      build,
      publish
    },
    cxt
  );
