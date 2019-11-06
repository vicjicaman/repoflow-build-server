import _ from "lodash";
import * as PublishRoutes from "../utils/publish";

const status = async (repositoryid, { fullname, version }, cxt) => {
  return { published: true };
};

const build = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {
};

const publish = async (
  repositoryid,
  { moduleid, mode, version, fullname, labels },
  cxt
) => {};

export const routes = (app, cxt) =>
  PublishRoutes.register(
    app,
    "folder",
    {
      status,
      build,
      publish
    },
    cxt
  );
