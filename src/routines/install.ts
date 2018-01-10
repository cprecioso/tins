import * as util from "../util";
import executeSpec from "../executor";
import * as Listr from "listr";
import chalk from "chalk";
import { pathExists } from "fs-extra";
import { resolve } from "path";
import * as packageJson from "package-json";
import * as got from "got";
import getPackager, { installCommands, Packager } from "../packagers";

export interface Context {
  anyDir: string;
  rawPkgs: string[];
  dev: boolean;
  dir?: string;
  typesNeeded?: boolean;
  pkgs: string[];
  devPkgs: string[];
  packager?: Packager;
}

export default async function install(
  anyDir: string,
  rawPkgs: string[],
  dev = false
) {
  const tasks = new Listr<Context>(
    [
      {
        title: "Getting module root",
        async task(ctx, task) {
          const dir = await util.getRoot(ctx.anyDir);
          task.title += chalk`: {green ${dir}}`;
          ctx.dir = dir;
        }
      },
      {
        title: "Checking if packages exist",
        async task(ctx, task) {
          const pkgs = [];
          for (const pkg of ctx.rawPkgs) {
            task.output = chalk`Checking {blue ${pkg}}`;
            if (await util.doesThePackageExist(pkg)) {
              pkgs.push(pkg);
            } else {
              console.error(
                chalk`Package {blue ${pkg}} {red does not exist} in npm registry, {underline skiping}...`
              );
            }
          }
          ctx.rawPkgs = pkgs;
          if (pkgs.length === 0) throw new Error("No packages left to install");
        }
      },
      {
        title: "Checking if types are needed",
        async task(ctx, task) {
          const dir = ctx.dir as string;
          const success = () => {
            ctx.typesNeeded = true;
            task.title += chalk`: {green Yes}`;
          };

          task.output = "Type-related packages in packages to install";
          if (util.areThereTypeRelatedPackages(ctx.rawPkgs)) return success();

          task.output = "tsconfig.json file in module root";
          if (await pathExists(resolve(dir, "tsconfig.json"))) return success();

          task.output = "Type-related packages in dependencies";
          if (util.areThereTypeRelatedPackages(await util.getDependencies(dir)))
            return success();

          ctx.typesNeeded = false;
          task.title += chalk`: {red No}`;
        }
      },
      {
        title: "Collecting packages",
        async task(ctx, task) {
          ctx[ctx.dev ? "devPkgs" : "pkgs"] = rawPkgs;
        }
      },
      {
        title: "Checking packages to list",
        skip: ctx => !ctx.typesNeeded,
        async task(ctx, task) {
          ctx.devPkgs.push("typescript");
          for (const pkg of ctx.pkgs || []) {
            task.output = chalk`Looking for types for {blue ${pkg}}`;

            task.output = `Are types declared in its package.json?`;
            const pjson = (await packageJson(pkg)) as any;
            if (pjson["types"] || pjson["typings"]) continue;

            task.output = `Does it have a index.d.ts in the root?`;
            try {
              await got.head(`https://unpkg.com/${pkg}/index.d.ts`);
              continue;
            } catch (_) {}

            const typePkg = "@types/" + pkg;
            task.output = chalk`Does {blue ${typePkg}} exist in the npm registry?`;
            if (await util.doesThePackageExist(typePkg)) {
              ctx.devPkgs.push(typePkg);
              continue;
            }

            task.output = chalk`{yellow Couldn't find types for {blue ${pkg}}}`;
          }
        }
      },
      {
        title: "Collecting types packages",
        skip: ctx => !ctx.typesNeeded,
        async task(ctx, task) {}
      },
      {
        title: "Getting package manager",
        async task(ctx, task) {
          const packager = await getPackager(ctx.dir as string);
          ctx.packager = packager;
          task.title += chalk`: {blue ${packager}}`;
        }
      },
      {
        title: "Installing production packages",
        skip: ctx => ctx.pkgs.length === 0,
        task(ctx, task) {
          if (!ctx.packager || !ctx.dir) throw new Error("Assertion error");
          return executeSpec({
            dir: ctx.dir,
            command: installCommands[ctx.packager](ctx.pkgs, false)
          });
        }
      },
      {
        title: "Installing development packages",
        skip: ctx => ctx.devPkgs.length === 0,
        task(ctx, task) {
          if (!ctx.packager || !ctx.dir) throw new Error("Assertion error");
          return executeSpec({
            dir: ctx.dir,
            command: installCommands[ctx.packager](ctx.devPkgs, true)
          });
        }
      }
    ],
    { exitOnError: true, collapse: false, renderer: "verbose" }
  );

  return tasks.run({ anyDir, rawPkgs, dev, pkgs: [], devPkgs: [] });
}
