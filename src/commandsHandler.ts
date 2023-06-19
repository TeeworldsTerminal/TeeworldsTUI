import path from "path";
import { ServerData } from ".";
import { readdir } from "fs/promises";

export type Command = {
  name: string;
  cb: (data: ServerData, args: string[], repl?: boolean) => any;
  aliases: string[];
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
    cb: (data: ServerData, args: string[], repl?: boolean) => any,
    aliases?: string[]
  ): boolean {
    if (
      this.commands.find(
        (x) =>
          x.name == name ||
          x.aliases.includes(name) ||
          x.aliases.some((y) => aliases?.includes(y))
      )
    ) {
      console.log(
        `Attempt to register command ${name} but conflicting name or aliases.`
      );
      return false;
    }

    this.commands.push({ name, cb, aliases: aliases ?? [] });

    return true;
  }

  // todo: fix return type
  run(name: string, data: ServerData, args: string[], repl?: boolean): any {
    let cmd = this.commands.find(
      (x) => x.name == name || x.aliases.includes(name)
    );

    if (!cmd) return false;

    return cmd.cb(data, args, repl);
  }
}
