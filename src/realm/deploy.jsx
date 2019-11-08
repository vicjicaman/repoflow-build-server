import path from "path";
import { exec, retry, wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";
import * as Config from "@nebulario/core-config";
import * as JsonUtils from "@nebulario/core-json";
import _ from "lodash";
import * as DeployRoutes from "../utils/deploy";

const deploy = async (repositoryid, deployable, cxt) => {
  const { moduleid, version, fullname, labels } = deployable;
  const {
    config: { cluster }
  } = cxt;

  cxt.logger.debug("realm.deployment", {
    repositoryid,
    moduleid,
    version,
    fullname,
    labels
  });

  if (!cluster) {
    cxt.logger.error("cluster.config.cluster.error", {
      config: cxt.config,
      workspace: cxt.workspace
    });
    throw new Error("cluster.config.error");
  }

  cxt.logger.debug("realm.deployment.cluster", { cluster });

  await Cluster.Tasks.Deploy.exec(
    repositoryid,
    { deployable },
    {
      handlers: {
        error: ({ entity: { type, file } }, error, cxt) =>
          cxt.logger.error("cluster.config.error", {
            type,
            file,
            error: error.toString()
          })
      },
      cluster
    },
    cxt
  );

  cxt.logger.debug("realm.deployment.cluster.done", {});
};

export const routes = (app, cxt) =>
  DeployRoutes.register(
    app,
    "realm",
    {
      deploy
    },
    cxt
  );
