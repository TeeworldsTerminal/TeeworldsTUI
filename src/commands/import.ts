import { existsSync } from "fs";
import path from "path";
import { terminal } from "terminal-kit";
import { commandHandler, friends } from "..";
import { homedir } from "os";
import { readFile } from "fs/promises";
import { splitSpace, writeFriends } from "../utils";

let fileName = "settings_ddnet.cfg";
let linux = path.join(homedir(), ".local", "share", "ddnet", fileName);
let windows = path.join("%APPDATA%", "ddnet", fileName);
let mac = path.join(homedir(), "Library", "Application Support", "ddnet");

commandHandler.register("import", importFn, {});

export async function importFn(args: string[]) {
  let p =
    process.platform == "linux"
      ? linux
      : process.platform == "win32"
        ? windows
        : process.platform == "darwin"
          ? mac
          : undefined;

  if (!p) {
    terminal(
      `Path unknown for platform ${process.platform}\nWhat is the path to your config: `
    );
    p = ((await terminal.inputField().promise) as string).replace(
      /^~(?=$|\/|\\)/,
      homedir()
    );
  }

  if (!existsSync(p)) {
    terminal("\nThat file does not exist.. Please input: ");

    p = ((await terminal.inputField().promise) as string).replace(
      /^~(?=$|\/|\\)/,
      homedir()
    );

    if (!existsSync(p)) {
      terminal("Still could not find the inputted file.. terminating.");
      process.exit();
    }
  }

  let inp = await readFile(p, { encoding: "utf8" });

  let d = inp.split("\n");

  let added = 0;
  let ignored = 0;

  for (let i = 0; i < d.length; ++i) {
    let c = d[i];

    if (!c.startsWith("add_friend")) continue;

    let name = splitSpace(c)?.[1];

    if (!name || name == "") continue;

    if (friends.friends.includes(name)) {
      terminal.red(`Friend ${name} already added\n`);
      ignored++;
      continue;
    }

    friends.friends.push(name);
    added++;
    terminal.green(`Added friend ${name}\n`);
  }

  writeFriends(friends);

  terminal.green(`\nAdded: ${added} friends\n Ignored: ${ignored}\n`);

  process.exit();
}
