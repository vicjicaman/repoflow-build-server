import * as PublishRoutes from "./publish";
import * as DeployRoutes from "./deploy";

export const routes = (app, cxt) => {
  PublishRoutes.routes(app, cxt);
  DeployRoutes.routes(app, cxt);
};
