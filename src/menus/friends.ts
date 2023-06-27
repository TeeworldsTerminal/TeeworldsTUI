import { terminal } from "terminal-kit";
import {
  ServerData,
  drawMainMenu,
  friends,
  getData,
  menuTracker,
  webScraper,
} from "..";
import { queryBinds, splitSpace, writeFriends } from "../utils";
import { PlayerCompletedMapsData, PlayerStats } from "../WebScraper";
import { drawServers } from "./servers";

export async function grabQuery(reference: string) {
  menuTracker.setMenu("query-input");

  // Without the wait the menu isnt fully cancelled properly??
  // Causing the query string to display on current line, rather than at bottom
  // Havnet fully debugged to find proper cause / fix
  // So just using this for now
  setTimeout(async () => {
    terminal.green("\n\nQuery: ");

    if (reference == "friends-main") {
      let resp = await terminal.inputField({
        autoComplete: friends.friends,
        autoCompleteHint: true,
        autoCompleteMenu: true,
      }).promise;

      drawFriendsMenu(resp);
    } else if (reference == "servers-main") {
      let resp = await terminal.inputField({}).promise;

      drawServers(resp);
    }
  }, 10);
}

export async function drawFriendsMenu(query = "") {
  menuTracker.setMenu("friends-main");

  terminal.eraseDisplayAbove();

  let queriedFriends = query
    ? friends.friends.filter((x) => x.includes(query))
    : friends.friends;

  if (query != "") {
    terminal.moveTo(1, 1);
    terminal.green(
      ` Showing ${queriedFriends.length} / ${friends.friends.length} friends for query: "${query}"}\n\n`
    );
  }

  let resp = await terminal.singleColumnMenu(
    [
      ...queriedFriends,
      "",
      "Add New Friend",
      "",
      "Import Friends",
      "",
      "Back To Main",
    ],
    { cancelable: true, keyBindings: queryBinds("column") }
  ).promise;

  if (resp === undefined) {
    return;
  }

  if (resp.selectedText == "Back To Main") {
    terminal.eraseDisplayAbove();
    drawMainMenu();
    return;
  } else if (resp.selectedText == "") {
    drawFriendsMenu();
    return;
  } else if (resp.selectedText == "Import Friends") {
    //importFriends();
  } else if (friends.friends.includes(resp.selectedText)) {
    drawSelectedUser(resp.selectedText);
  } else if (resp.selectedText == "Add New Friend") {
    addFriend();
  }
}

// Would be nice to make it so the name is editable rather than having to write a name from scratch
export async function addFriendInput() {
  terminal.eraseDisplayAbove();

  terminal("Name: ");

  addFriend(await terminal.inputField().promise);
}

export async function addFriend(name = "") {
  terminal.eraseDisplayAbove();

  terminal.moveTo(1, 1);

  let resp = await terminal.gridMenu([
    `Name: ${name}`,
    "",
    "Add Friend",
    "",
    "Back",
  ]).promise;

  if (resp.selectedText == `Name: ${name}`) {
    addFriendInput();
    return;
  } else if (resp.selectedText == "") {
    addFriend(name);
    return;
  } else if (resp.selectedText == "Back") {
    drawFriendsMenu();
    return;
  } else if (resp.selectedText == "Add Friend") {
    if (!name) {
      let str = " You need to provide a name...";
      terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
      let sp = await terminal.spinner();
      terminal.red(str);

      setTimeout(() => {
        sp.animate(false);
        addFriend(name);
      }, 1000);

      return;
    }

    if (friends.friends.includes(name)) {
      terminal("\n");
      let str = ` ${name} is already added as a friend...`;
      terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
      let sp = await terminal.spinner("impulse");
      terminal.red(str);

      setTimeout(() => {
        sp.animate(false);
        addFriend();
      }, 1000);

      return;
    }

    friends.friends.push(name);
    writeFriends(friends);

    let str = ` Added ${name} as a friend`;
    terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);

    terminal("\n");
    let sp = await terminal.spinner("impulse");

    terminal.green(str);

    setTimeout(() => {
      sp.animate(false);
      terminal.eraseDisplayAbove();
      addFriend();
    }, 1000);
  }
}

export async function drawSelectedUser(
  name: string,
  extra?: {
    data?: ServerData;
    reference?: "find" | "friends";
  }
) {
  terminal.eraseDisplayAbove();

  let str = " Fetching server data...";

  terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);

  let spinner = await terminal.spinner("impulse");
  terminal.green(str);

  let data = extra?.data ?? ((await getData("server")) as ServerData);

  spinner.animate(false);
  terminal.eraseDisplayAbove();

  // Same shit again with cursor idk
  terminal.moveTo(1, 1);

  let server = data.servers.find((x) =>
    x.info.clients?.find((c) => c.name == name)
  );

  terminal.green(`Selected User: ${name}\n`);
  (server &&
    terminal.green(
      `Playing: ${server.info.map.name} (${server.info.game_type})\n\n`
    )) ||
    terminal.red("Offline\n\n");

  let resp = await terminal.singleColumnMenu([
    friends.friends.includes(name) ? "Remove Friend" : "Add Friend",
    "Stats",
    "",
    "Back To Friends",
  ]).promise;

  switch (resp.selectedText) {
    case "": {
      drawSelectedUser(name, { data });
      return;
    }
    case "Back To Friends": {
      drawFriendsMenu();
      break;
    }

    case "Stats": {
      drawPlayerStats(name);
      break;
    }

    case "Remove Friend": {
      friends.friends.splice(friends.friends.indexOf(name), 1);
      writeFriends(friends);

      terminal.eraseDisplayAbove();

      let str = `  Removed ${name} as a friend.`;
      terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
      let sp = await terminal.spinner("impulse");
      terminal.green(str);

      setTimeout(() => {
        sp.animate(false);
        terminal.eraseDisplayAbove();
        terminal.moveTo(1, 1);
        drawFriendsMenu();
      }, 1000);

      break;
    }

    case "Add Friend": {
      if (friends.friends.includes(name)) return;
      friends.friends.push(name);

      if (extra?.reference == "find") {
        // TODO: change this to drawFind once done
        drawMainMenu();
        break;
        // Tbh this case should never be true?
      } else if (extra?.reference == "friends") {
        drawFriendsMenu();
        break;
      }
    }
  }
}

async function drawPlayerStats(name: string, stats?: PlayerStats) {
  terminal.eraseDisplayAbove();

  let str = `  Fetching stats for ${name}...`;

  terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
  let sp = await terminal.spinner("impulse");

  terminal.green(str);
  stats = stats ?? (await webScraper.getPlayerStats(name));

  sp.animate(false);
  terminal.eraseDisplayAbove();
  terminal.moveTo(1, 1);

  terminal(
    `\n${name}'s Stats\n\nPoints: ${stats.points} / ${stats.totalPoints}\nMaps: ${stats.completedMaps} / ${stats.totalMaps}\n\n`
  );

  let resp = await terminal.gridMenu([
    ...(stats.mapData.map((x) => x?.difficulty) as string[]),
    "",
    "",
    "Main Menu",
  ]).promise;

  if (resp.selectedText == "") {
    drawPlayerStats(name, stats);
    return;
  } else if (resp.selectedText == "Main Menu") {
    terminal.eraseDisplayAbove();
    drawMainMenu();
    return;
  } else {
    drawDifficultyStats(name, stats, resp.selectedText);
  }
}

async function drawDifficultyStats(
  name: string,
  stats: PlayerStats,
  difficulty: string
) {
  terminal.eraseDisplayAbove();

  terminal(`Player: ${name}\nDifficulty: ${difficulty}\n\n`);
  let s = stats.mapData.find((x) => x?.difficulty === difficulty);

  terminal(
    `Points: ${s?.points} / ${s?.totalPoints}\nMaps: ${s?.completedMaps} / ${s?.totalMaps}\n\n`
  );

  let resp = await terminal.gridMenu(["View Maps", "Go Back"]).promise;

  if (resp.selectedText == "Go Back") {
    drawPlayerStats(name, stats);
  } else if (resp.selectedText == "View Maps") {
    drawListMaps(name, s as PlayerCompletedMapsData, stats);
  }
}

async function drawListMaps(
  name: string,
  maps: PlayerCompletedMapsData,
  stats: PlayerStats
) {
  terminal.eraseDisplayAbove();

  terminal(`${name}'s ${maps.difficulty} maps\n\n`);

  let resp = await terminal.gridMenu([
    ...(maps?.maps?.map((x) => x.name) as string[]),
    "",
    "",
    "Go Back",
  ]).promise;

  if (resp.selectedText == "") {
    drawListMaps(name, maps, stats);
    return;
  } else if (resp.selectedText == "Go Back") {
    drawDifficultyStats(name, stats, maps.difficulty);
  } else {
    drawMap(name, maps, resp.selectedText, stats);
  }
}

async function drawMap(
  name: string,
  maps: PlayerCompletedMapsData,
  mapName: string,
  stats: PlayerStats
) {
  terminal.eraseDisplayAbove();

  terminal.moveTo(1, 1);

  terminal(`${name}'s Map Data For ${mapName}\n\n`);
  let selected = maps!.maps!.find((x) => x.name == mapName);

  terminal(
    `Finished: ${selected?.finished}\nTime: ${selected?.time}\nRank: ${selected?.rank}\nFinishes: ${selected?.finishes}\n\n`
  );

  let resp = await terminal.gridMenu(["Go Back"]).promise;

  if (resp.selectedText == "Go Back") {
    drawListMaps(name, maps, stats);
  }
}
