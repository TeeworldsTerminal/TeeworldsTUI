#!/usr/bin/env node

import path from "path";
import { CommandHandler } from "./commandsHandler";
import { checkVersion, setupJSON } from "./utils";
import { WebScraper } from "./WebScraper";
import { terminal } from "terminal-kit";
import { drawFriendsMenu } from "./menus/friends";

export type ServerData = {
  servers: {
    addresses: string[];
    info: {
      name: string;
      map: { name: string };
      clients: {
        name: string;
        clan: string;
        team: number;
        skin: { name: string; color_body?: number; color_feet?: number };
      }[];
      game_type: string;
    };
  }[];
};

export type DataTypes = ServerData;

let commands = [
  "find",
  "friends",
  "repl",
  "notifier",
  "player",
  "import",
  "skin",
];

let serverUrl = "https://master1.ddnet.org/ddnet/15/servers.json";

export let friends = setupJSON();

export let commandHandler = new CommandHandler();
export let webScraper = new WebScraper();

terminal.on("key", (name: string, _m: string, _d: string) => {
  if (name == "CTRL_C") {
    terminal.eraseDisplayAbove();
    process.exit();
  }
});

async function main() {
  await checkVersion();

  drawMainMenu();
}

export function drawMainMenu() {
  terminal.brightBlue("\n\nTeeworlds TUI\n\n");
  terminal.singleColumnMenu(["Friends", "Find", "Quit"], (err, resp) => {
    switch (resp.selectedText) {
      case "Quit": {
        terminal.eraseDisplayAbove();
        process.exit();
      }
      case "Friends": {
        drawFriendsMenu();
        break;
      }
    }
  });
}

// Turn dtype into an enum??
export async function getData(
  dType: "server" | "NOT_IMPLEMENTED"
): Promise<DataTypes | undefined> {
  if (dType == "server")
    return (await (await fetch(serverUrl)).json()) as ServerData;
}

export async function handle(
  args: string[],
  repl?: boolean
): Promise<{ success: boolean; message: string } | void> {
  return await commandHandler.run(args[0], args.splice(1), repl);
}

main();
