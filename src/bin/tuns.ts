#!/usr/bin/env node
import * as yargs from "yargs";
import uninstallPackages from "../routines/uninstall";

yargs
  .usage(
    "$0 <packages...>",
    "uninstall packages and optionally their types",
    yargs => {
      return yargs.positional("packages", {
        describe: "packages to be uninstalled"
      });
    },
    argv => {
      uninstallPackages(process.cwd(), argv.packages);
    }
  )
  .help()
  .version().argv;
