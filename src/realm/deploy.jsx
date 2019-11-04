import path from "path";
import { exec, retry, wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";
import * as Config from "@nebulario/core-config";
import * as JsonUtils from "@nebulario/core-json";
import _ from "lodash";
import * as DeployRoutes from "../utils/deploy";

const status = async (repositoryid, { fullname, version }, cxt) => {
  return { deployed: true };
};

const deploy = async (
  repositoryid,
  { moduleid, version, fullname, labels },
  cxt
) => {
  /*await Cluster.Tasks.Deploy.exec(
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
  );*/
};

export const routes = (app, cxt) =>
  DeployRoutes.register(
    app,
    "realm",
    {
      status,
      deploy
    },
    cxt
  );
