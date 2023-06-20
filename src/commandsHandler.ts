import path from "path";
import { readdir } from "fs/promises";

export type Command = {
  name: string;
  cb: (args: string[]) => void;

  // Adding this replCb just causes alot of duplicate code, but for me
  // Makes it cleaner to understand, might rever if it causes too much duplicate
  extra: {
    replCb?: (
      args: string[]
    ) =>
      | Promise<{ success: boolean; message: string } | void>
      | void
      | { success: boolean; message: string };
    aliases?: string[];
  };
};

// This makes it so much slower since it needs to readdir, might revert.
// Or just stick to repl usage so theres only one slowdown for readdir
export class CommandHandler {
  commands = new Array<Command>();

  constructor() { }

  async loadCommands(folder: string) {
    let p = await readdir(folder);

    for (let i = 0; i < p.length; i++) {
      require(path.join(folder, p[i]));
    }
  }

  register(
    name: string,
    cb: (args: string[], repl?: boolean) => void,
    extra: {
      replCb?: (
        args: string[]
        // todo: make this shit its own type
      ) =>
        | Promise<{ success: boolean; message: string } | void>
        | void
        | { success: boolean; message: string };
      aliases?: string[];
    }
  ): boolean {
    if (
      this.commands.find(
        (x) =>
          x.name == name ||
          x.extra.aliases?.includes(name) ||
          x.extra.aliases?.some((y) => extra.aliases?.includes(y))
      )
    ) {
      console.log(
        `Attempt to register command ${name} but conflicting name or aliases.`
      );
      return false;
    }

    this.commands.push({
      name,
      cb,
      extra: { replCb: extra.replCb, aliases: extra.aliases ?? [] },
    });

    return true;
  }

  async run(
    name: string,
    args: string[],
    repl?: boolean
  ): Promise<{ success: boolean; message: string } | undefined | void> {
    let cmd = this.commands.find(
      (x) => x.name == name || x.extra.aliases?.includes(name)
    );

    if (!cmd) return;

    return repl ? await cmd.extra.replCb?.(args) : cmd.cb(args);
  }
}
