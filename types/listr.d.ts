declare module "listr" {
  namespace Listr {
    type AcceptableReturns =
      | any
      | PromiseLike<any>
      | NodeJS.ReadableStream;

    type AcceptableBooleans = boolean | string | PromiseLike<boolean | string>;

    interface Event {
      type: "STATE" | "DATA" | "SUBTASKS" | "TITLE" | "ENABLED";
      data: any;
    }

    interface TaskDefinition<Context> {
      title: string;
      task: (ctx: Context, task: Task<Context>) => AcceptableReturns;
      skip?: (ctx: Context) => AcceptableBooleans;
      enabled?: (ctx: Context) => AcceptableBooleans;
    }

    interface Task<Context> extends TaskDefinition<Context> {
      output: string;
      state: string;
      subtasks: Task<any>[];
      isEnabled(): boolean;
      isSkipped(): boolean;
      isPending(): boolean;
      hasFailed(): boolean;
      subscribe(observer: (event: Event) => void): void;
    }

    type PossibleRenderers = "default" | "verbose" | "silent" | Renderer;

    type Dictionary = { [key: string]: any };

    interface Options extends Dictionary {
      concurrent?: boolean | number;
      exitOnError?: boolean;
      renderer?: PossibleRenderers;
      nonTTYRenderer?: PossibleRenderers;
    }

    abstract class Renderer {
      constructor(tasks: Listr.Task<any>[], options: Options);
      static readonly nonTTY: boolean;
      render(): void;
      end(err: any): void;
    }
  }

  class Listr<Context> {
    constructor(
      tasks: Listr.TaskDefinition<Context>[],
      options?: Listr.Options
    );
    add(task: Listr.TaskDefinition<any> | Listr.TaskDefinition<any>[]): this;
    run(ctx: Context): Promise<Context>;
  }

  export = Listr;
}
