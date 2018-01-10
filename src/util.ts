import * as findUp from "find-up";
import * as readPkg from "read-pkg";
import * as got from "got";
import { dirname } from "path";

export async function getRoot(anyDir: string) {
  const file = await findUp(
    ["package.json", "node_modules", "yarn.lock", "package-lock.json"],
    { cwd: anyDir }
  );
  if (!file) throw new Error("Can't find project root");
  return dirname(file);
}

export async function doesThePackageExist(pkg: string) {
  let isTaken = false
  try {
    await got.head(`https://unpkg.com/${pkg}/package.json?meta`);
    isTaken = true
  } catch (_) { }
  return isTaken;
}

export async function getDependencies(dir: string) {
  return (function*(info) {
    if (info["dependencies"]) yield* Object.keys(info["dependencies"]);
    if (info["devDependencies"]) yield* Object.keys(info["devDependencies"]);
  })(await readPkg(dir, { normalize: false }));
}

export function areThereTypeRelatedPackages(pkgs: Iterable<string>) {
  for (const pkg of pkgs) {
    if (pkg === "typescript" || pkg.startsWith("@types/")) return true;
  }
  return false;
}
