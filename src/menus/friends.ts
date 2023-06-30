import { terminal } from "terminal-kit";
import {
  ServerData,
  bindHandler,
  drawMainMenu,
  friends,
  getData,
  menuTracker,
  webScraper,
} from "..";
import {
  queryBinds,
  splitSpace,
  writeFriends,
  emojis,
  longestName,
} from "../utils";
import { PlayerCompletedMapsData, PlayerStats } from "../WebScraper";
import { drawServers } from "./servers";

export async function grabQuery(reference: string, extra?: any) {
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

      drawFriendsMenu(resp, extra);
    } else if (reference == "servers-main") {
      let resp = await terminal.inputField({}).promise;

      drawServers(resp, extra);
    }
  }, 10);
}
// TODO: pass data when changing pages
export async function drawFriendsMenu(
  query = "",
  extra: { page?: number; data?: ServerData } = { page: 1 }
) {
  terminal.eraseDisplay();

  let data = (extra.data ?? (await getData("server")))!;

  menuTracker.setServerData(data);

  let queriedFriends = query
    ? friends.friends.filter((x) => x.includes(query))
    : friends.friends;

  let perPage = terminal.height - 12;
  let curPage = extra.page || 1;
  let maxPage = Math.ceil(queriedFriends.length / perPage);

  if (curPage < 1) curPage = 1;
  if (curPage > maxPage) curPage = maxPage;

  menuTracker
    .setMenu("friends-main")
    .setFriendsPage(curPage || 1)
    .setFriendsQuery(query)
    .setFriendsMaxPerPage(perPage);

  terminal.moveTo(1, 1);
  terminal.green(`Page: ${curPage} / ${maxPage} (${perPage} per page)\n`);

  let filtered = queriedFriends.filter(
    (x, i) => i >= curPage * perPage - perPage && i < curPage * perPage
  );

  let onlineFriends: string[] = [];

  for (let i = 0; i < data.servers.length; i++) {
    let y = data.servers[i].info.clients?.find((x) =>
      friends.friends.includes(x.name)
    );

    if (y) onlineFriends.push(y.name);
  }

  if (query != "") {
    terminal.green(
      `Showing ${queriedFriends.length} / ${friends.friends.length} friends for query: "${query}"\n\n`
    );
  }

  menuTracker.setFriendsFilteredData(filtered);

  let extraButtons = [
    "",
    "Previous Page [<-]",
    "Next Page [->]",
    "",
    "Add New Friend [A]",
    "",
    "Import Friends",
    "",
    "Back To Main [ESC]",
  ];

  let longest = longestName(filtered);

  let resp = await terminal.singleColumnMenu(
    [
      ...filtered.map((x) =>
        onlineFriends.includes(x)
          ? `${x} ${" ".repeat(longest - x.length + 10)}  ${emojis.greenCircle}`
          : `${x} ${" ".repeat(longest - x.length + 10)}  ${emojis.redCircle}`
      ),
      ...extraButtons,
    ],
    {
      cancelable: true,
      keyBindings: queryBinds("column"),
    }
  ).promise;

  if (resp.selectedText === undefined) {
    return;
  }

  if (resp.selectedText == "Back To Main [ESC]") {
    terminal.eraseDisplay();
    drawMainMenu();
    return;
  } else if (resp.selectedText == "") {
    drawFriendsMenu();
    return;
  } else if (resp.selectedText == "Import Friends") {
    //importFriends();
  } else if (resp.selectedText == "Add New Friend [A]") {
    addFriend();
  } else if (resp.selectedText == "Previous Page [<-]") {
    drawFriendsMenu(query, { page: curPage - 1 });
  } else if (resp.selectedText == "Next Page [->]") {
    drawFriendsMenu(query, { page: curPage + 1 });
  } else {
    drawSelectedUser(filtered[resp.selectedIndex]);
  }
}

// Would be nice to make it so the name is editable rather than having to write a name from scratch
export async function addFriendInput() {
  terminal("\n\nName: ");

  addFriend(await terminal.inputField().promise);
}

export async function addFriend(name = "") {
  menuTracker.setMenu("friends-add").setPreviousMenu("friends-main");
  terminal.eraseDisplay();

  terminal.moveTo(1, 1);

  let resp = await terminal.singleLineMenu(
    [`Name: ${name}`, "", "Add Friend [A]", "", "Back [ESC]"],
    {
      cancelable: true,
      keyBindings: {
        ESCAPE: "escape",
        ENTER: "submit",
        LEFT: "previous",
        UP: "next",
        RIGHT: "next",
        DOWN: "previous",
      },
    }
  ).promise;

  if (resp.selectedText == undefined) return;

  if (resp.selectedText == `Name: ${name}`) {
    addFriendInput();
    return;
  } else if (resp.selectedText == "") {
    addFriend(name);
    return;
  } else if (resp.selectedText == "Back [ESC]") {
    drawFriendsMenu();
    return;
  } else if (resp.selectedText == "Add Friend [A]") {
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
  menuTracker.setMenu("player-stats");

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

// Wrap in function to fix circular dependancy shit
export function registerFriendBinds() {
  bindHandler.register("friends-main", "LEFT", () =>
    drawFriendsMenu(menuTracker.getFriendsQuery(), {
      page: menuTracker.getFriendsPage() - 1,
      data: menuTracker.getServerData(),
    })
  );

  bindHandler.register("friends-main", "RIGHT", () =>
    drawFriendsMenu(menuTracker.getFriendsQuery(), {
      page: menuTracker.getFriendsPage() + 1,
      data: menuTracker.getServerData(),
    })
  );

  bindHandler.register("friends-main", "f", () =>
    grabQuery(menuTracker.getMenu())
  );

  bindHandler.register("friends-main", "ESCAPE", () => {
    terminal.eraseDisplay();
    drawMainMenu();
  });

  bindHandler.register("friends-main", "a", () => addFriend());

  bindHandler.register("friends-add", "ESCAPE", () =>
    drawFriendsMenu(menuTracker.getFriendsQuery(), {
      page: menuTracker.getFriendsPage(),
    })
  );
}
