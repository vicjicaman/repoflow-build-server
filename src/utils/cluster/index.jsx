import _ from 'lodash'
import fs from 'fs';
import path from 'path'
import * as Config from '@nebulario/core-config';
import * as JsonUtils from '@nebulario/core-json'


export const config = (folder, compFile) => {

  const config = JsonUtils.load(path.join(folder, "config.json"));
  const values = Config.values(folder, config);

  const outputPath = path.join(folder, "dist");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const srcFile = path.join(folder, compFile);
  const destFile = path.join(outputPath, compFile);

  const raw = fs.readFileSync(srcFile, "utf8");
  const convert = Config.replace(raw, values);
  fs.writeFileSync(destFile, convert, "utf8");


  postProcessEnv(destFile);

  const raw2 = fs.readFileSync(destFile, "utf8");
  fs.writeFileSync(destFile, raw2.replace(new RegExp("- yes", "g"), "- 'yes'"), "utf8");

}

const postProcessEnv = file => {
  const ent = JsonUtils.load(file, true);

  if (_.get(ent, "spec.template.spec.containers", null)) {
    ent.spec.template.spec.containers = ent.spec.template.spec.containers.map(
      cont => {
        if (cont.env) {
          cont.env = cont.env.map(entry => {
            entry.value = entry.value.toString();
            return entry;
          });
        }
        return cont;
      }
    );
  }

  JsonUtils.save(file, ent, true);
};
