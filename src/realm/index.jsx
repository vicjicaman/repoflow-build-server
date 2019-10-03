import path from "path";
import * as Repository from "../utils/repository";
import { exec, retry, wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";
import * as Config from "@nebulario/core-config";
import * as JsonUtils from "@nebulario/core-json";

export const type = "realm";
export const routes = async (app, cxt) => {
  console.log("Register realm routes");

  app.post("/build/realm", async (req, res) => {
    console.log("Build request realm!");
    console.log(JSON.stringify(req.body, null, 2));

    try {
      const params = req.body;

      const { moduleid, mode, version, fullname } = params;

      const { folder: repositoryFolder } = await Repository.init(
        params,
        {
          type
        },
        cxt
      );

      await Config.init(repositoryFolder);
      Config.build(repositoryFolder);
      const values = Config.load(repositoryFolder);

      cxt.params = {};
      await Cluster.Tasks.Build.exec(
        repositoryFolder,
        {
          general: {
            hooks: {
              error: ({ type, file }, { error }) =>
                console.log(type + " " + file + "  " + error.toString()),
              pre: e => e,
              post: ({ type, file }) =>
                console.log(type + " " + file + " configured ")
            },
            params: { values }
          }
        },
        {},
        cxt
      );

      const repository = await Repository.publish(
        params,
        {
          folder: repositoryFolder
        },
        cxt
      );

      res.json({
        success: true,
        message: "Realm repository published."
      });
    } catch (e) {
      console.log("ERROR:" + e.toString());

      res.json({
        error: e.toString()
      });
    } finally {
      res.end();
    }
  });
};
