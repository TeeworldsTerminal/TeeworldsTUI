#!/usr/bin/env node

import path from "path";
import { CommandHandler } from "./commandsHandler";
import { checkVersion, setupJSON } from "./utils";
import { WebScraper } from "./WebScraper";
import { terminal } from "terminal-kit";
import {
  drawFriendsMenu,
  grabQuery,
  handleFriendsBinds,
} from "./menus/friends";
import { MenuTracker } from "./MenuTracker";
import { drawServers, handleServersBinds } from "./menus/servers";

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
export let menuTracker = new MenuTracker();

terminal.on("key", (name: string, _m: string, _d: string) => {
  if (name == "CTRL_C") {
    terminal.eraseDisplayAbove();
    process.exit();
  }

  if (menuTracker.getMenu() == "friends-main") {
    handleFriendsBinds(name);
  } else if (menuTracker.getMenu() == "servers-main") {
    handleServersBinds(name);
  }
});

async function main() {
  // await checkVersion();

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
