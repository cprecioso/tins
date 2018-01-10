declare module "package-json" {
  interface PackageJsonOptions {
    version?: string;
    fullMetadata?: boolean;
    allVersions?: boolean;
  }

  namespace packageJson { }

  function packageJson(
    name: string,
    options?: PackageJsonOptions
  ): Promise<{}>;

  export = packageJson;
}
