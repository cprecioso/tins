#!/usr/bin/env node
import * as yargs from "yargs";
import installPackages from "../routines/install";

yargs
  .usage(
    "$0 <packages...>",
    "install packages and optionally their types",
    yargs => {
      return yargs.positional("packages", {
        describe: "packages to be installed"
      });
    },
    argv => {
      installPackages(process.cwd(), argv.packages, argv.dev);
    }
  )
  .option("dev", {
    alias: "d",
    default: false
  })
  .help()
  .version().argv;
