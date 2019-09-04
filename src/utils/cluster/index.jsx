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
}
