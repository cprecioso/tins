import * as util from "../util";
import * as Listr from "listr";
import chalk from "chalk";
import intersection = require("lodash.intersection");
import getPackager, { uninstallCommands, Packager } from "../packagers";
import executeSpec from "../executor";

export interface Context {
  anyDir: string;
  rawPkgs: string[];
  dir?: string;
  allPkgs: string[];
  pkgs: string[];
  packager?: Packager;
}

export default async function uninstall(anyDir: string, rawPkgs: string[]) {
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
        title: "Generating list of packages",
        async task(ctx, task) {
          const allPkgs = [];
          for (const pkg of ctx.rawPkgs) {
            task.output = pkg;
            allPkgs.push(pkg);
            allPkgs.push("@types/" + pkg);
          }
          ctx.allPkgs = allPkgs;
        }
      },
      {
        title: "Checking installed packages",
        async task(ctx, task) {
          const pkgs = intersection(ctx.allPkgs, [
            ...(await util.getDependencies(ctx.dir as string))
          ]);
          ctx.pkgs = pkgs;
        }
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
        title: "Uninstalling packages",
        skip: ctx => ctx.pkgs.length === 0,
        task(ctx, task) {
          if (!ctx.packager || !ctx.dir) throw new Error("Assertion error");
          return executeSpec({
            dir: ctx.dir,
            command: uninstallCommands[ctx.packager](ctx.pkgs)
          });
        }
      }
    ],
    { exitOnError: true, collapse: false, renderer: "verbose" }
  );

  return tasks.run({ anyDir, rawPkgs, allPkgs: [], pkgs: [] });
}
