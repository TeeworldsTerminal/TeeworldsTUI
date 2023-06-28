import { existsSync, writeFileSync } from "fs";
import path from "path";
import { terminal } from "terminal-kit";
import { ServerData } from ".";

export type JsonLayout = {
  friends: string[];
  clans: string[];
};

export function queryBinds(menuType: "line" | "column" | "grid"): {
  [key: string]: string;
} {
  if (menuType == "column") {
    return {
      UP: "previous",
      // All custom  binds must also escape otherwise menus will stack
      f: "escape",
      q: "escape",
      LEFT: "escape",
      RIGHT: "escape",
      ESCAPE: "escape",
      a: "escape",
      DOWN: "next",
      ENTER: "submit",
      // These now used for next/previous page, may change
      // LEFT: "first",
      // RIGHT: "last",
    };
  }

  // Too lazy to do this shit now
  return { f: "escape" };
}

export function setupJSON() {
  let jsonPath = path.join(__dirname, "../config.json");

  if (existsSync(jsonPath)) {
    return require(jsonPath) as JsonLayout;
  } else {
    writeFileSync(jsonPath, JSON.stringify({ friends: [], clans: [] }));
    return { friends: [], clans: [] } as JsonLayout;
  }
}

// No error handling because im lazy
export function writeFriends(friends: JsonLayout) {
  writeFileSync(
    path.join(__dirname, "../config.json"),
    JSON.stringify(friends)
  );
}

export function getServerClient(data: ServerData, name: string) {
  for (let i = 0; i < data.servers.length; i++) {
    let server = data.servers[i];

    let x = server.info.clients?.find((x) => x.name == name);

    if (x) return x;
  }
}

export function splitSpace(str?: string) {
  return str
    ?.match(/"[^"]+"|\S+/g)
    ?.map((m: string) => m.replace(/^"(.*)"$/, "$1"));
}

export async function checkVersion() {
  let latest = (
    await (
      await fetch("https://registry.npmjs.org/@wocketwun/tw.ts/latest")
    ).json()
  ).version;
  let ls = latest.split(".");
  let current = require(path.join(__dirname, "..", "package.json")).version;
  let cs = current.split(".");

  for (let i = 0; i < ls.length; i++) {
    if (parseInt(ls[i]) > parseInt(cs[i])) {
      terminal.brightGreen(
        `New version available (${current} -> ${latest})\nRun "npm update -g @wocketwun/tw.ts"\n\n`
      );
      return;
    }
  }

  terminal.brightGreen(`@wocketwun/tw.ts using latest version ${current}\n\n`);
}
