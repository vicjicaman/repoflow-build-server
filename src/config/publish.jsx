import _ from "lodash";
import path from "path";
import { retry, wait } from "@nebulario/core-process";
import * as Config from "@nebulario/core-config";
import * as PublishRoutes from "../utils/publish";

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
};

const publish = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {};

export const routes = (app, cxt) =>
  PublishRoutes.register(
    app,
    "config",
    {
      status,
      build,
      publish
    },
    cxt
  );
