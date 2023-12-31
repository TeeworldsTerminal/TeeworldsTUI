#!/usr/bin/env node

import { CommandHandler } from "./commandsHandler";
import { checkVersion, emojis, setupJSON } from "./utils";
import { WebScraper } from "./WebScraper";
import { terminal } from "terminal-kit";
import { drawFriendsMenu, registerFriendBinds } from "./menus/friends";
import { MenuTracker } from "./MenuTracker";
import { drawServers, registerServerBinds } from "./menus/servers";
import { BindHandler } from "./BindHandler";

export type ServerData = {
  servers: Server[];
};

export type Server = {
  addresses: string[];
  location: string;
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
export let menuTracker = new MenuTracker();
export let bindHandler = new BindHandler();

terminal.on("key", (name: string, _m: string, _d: string) => {
  if (name == "CTRL_C") {
    terminal.eraseDisplayAbove();
    process.exit();
  }

  bindHandler.runBind(menuTracker.getMenu(), name);
});

async function main() {
  // await checkVersion();

  // Register binds through functions to prevent circular dependancy funny shit
  registerFriendBinds();
  registerServerBinds();
  drawMainMenu();
}

export async function drawMainMenu() {
  menuTracker.setMenu("main").setPreviousMenu("menu");
  terminal.brightBlue("\n\nTeeworlds TUI\n\n");

  let resp = await terminal.singleColumnMenu([
    "Friends",
    "Find",
    "Servers",
    "Quit",
  ]).promise;

  switch (resp.selectedText) {
    case "Quit": {
      terminal.eraseDisplayAbove();
      process.exit();
    }
    case "Friends": {
      drawFriendsMenu();
      break;
    }
    case "Servers": {
      drawServers();
      break;
    }
  }
}

// Turn dtype into an enum??
export async function getData(
  dType: "server" | "NOT_IMPLEMENTED"
): Promise<DataTypes | undefined> {
  if (dType == "server")
    return (await (await fetch(serverUrl)).json()) as ServerData;
}

main();
