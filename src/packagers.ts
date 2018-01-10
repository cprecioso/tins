import { Command } from "./executor";
import { pathExists } from "fs-extra";
import { resolve } from "path";

export interface PackagerFunctions<T extends Function> {
  npm: T;
  yarn: T;
}

export type Packager = keyof PackagerFunctions<any>

export default async function getPackager(
  dir: string
): Promise<keyof PackagerFunctions<any>> {
  if (await pathExists(resolve(dir, "yarn.lock"))) {
    return "yarn";
  } else {
    return "npm";
  }
}

export const installCommands: PackagerFunctions<
  (pkgs: string[], dev: boolean) => Command
> = {
  npm: (pkgs, dev) => ["npm", ["install", dev ? "-D" : "-SP", ...pkgs]],
  yarn: (pkgs, dev) => ["yarn", ["add", ...(dev ? ["--dev"] : []), ...pkgs]]
};

export const uninstallCommands: PackagerFunctions<
  (pkgs: string[]) => Command
> = {
  npm: pkgs => ["npm", ["uninstall", "-DSP", ...pkgs]],
  yarn: pkgs => ["yarn", ["remove", ...pkgs]]
};
