import * as execa from "execa";

export type Command = [string, string[]];

export interface CommandSpec {
  dir: string;
  command: Command;
}

export default async function executeSpec(spec: CommandSpec) {
  const [program, args] = spec.command
  await execa(program, args, {
    cwd: spec.dir,
    stdio: "inherit",
    shell: true
  });
}
