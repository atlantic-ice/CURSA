import fs from "fs";
import path from "path";

describe("App public route contract", () => {
  const appSource = fs.readFileSync(path.join(__dirname, "App.tsx"), "utf8");

  test.each(["/guidelines", "/examples", "/materials", "/resources"])(
    "keeps %s as a public route",
    (routePath) => {
      expect(appSource).toContain(`path="${routePath}"`);
    },
  );
});
