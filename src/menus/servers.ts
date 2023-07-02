import { terminal } from "terminal-kit";
import {
  Server,
  ServerData,
  bindHandler,
  drawMainMenu,
  getData,
  menuTracker,
} from "..";
import { emojis, longestName, queryBinds } from "../utils";
import { grabQuery } from "./friends";

export async function drawServers(
  query = "",
  extra: {
    filter: "none" | "ascending" | "descending";
    page: number;
    data?: ServerData;
  } = {
    filter: "none",
    page: 1,
  }
) {
  menuTracker
    .setMenu("servers-main")
    .setServerQuery(query)
    .setServerFilter(extra.filter);

  terminal.eraseDisplay();
  let str = ` Fetching server list...`;

  terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
  let sp = await terminal.spinner("impulse");
  terminal.green(str);

  let data = extra.data || ((await getData("server")) as ServerData);
  sp.animate(false);
  terminal.eraseDisplay();
  terminal.moveTo(1, 1);

  menuTracker.setServerData(data);

  let filtered =
    query == ""
      ? data?.servers
      : data?.servers.filter((x) =>
          `${x.info.name} (::) ${x.info.map?.name} (::) ${x.info.clients?.length} / 64 (::) ${x.addresses[0]}`.includes(
            query
          )
        );

  if (extra.filter == "ascending") {
    filtered = filtered?.sort(
      (a, b) => a.info.clients.length - b.info.clients.length
    );
  } else if (extra.filter == "descending") {
    filtered = filtered?.sort(
      (a, b) => b.info.clients.length - a.info.clients.length
    );
  }

  let perPage = terminal.height - 17; // Can be annoying to only show so little, but sometimes pushes too far offscreen
  let maxPage = Math.ceil(filtered!.length / perPage);
  let curPage = extra.page;

  if (curPage > maxPage) curPage = maxPage;
  if (curPage < 1) curPage = 1;

  // Set page in tracker after any corrections just incase;
  menuTracker.setServerPage(curPage).setServersMaxPage(maxPage);

  filtered = filtered?.filter(
    (x, y) => y >= curPage * perPage - perPage && y < curPage * perPage
  );

  terminal.green(
    `Page: ${curPage} / ${maxPage} (${perPage} per page)\nFilter: ${extra.filter}\n`
  );

  if (query != "")
    terminal.green(
      `Showing ${filtered?.length} / ${data?.servers.length} servers with query "${query}"`
    );

  // Probably slow, but it will probably only be an array of 15-20 items depending on terminal size
  let longestServ = `${longestName(filtered.map((x) => x.info.name))}`;
  let longestMap = longestName(filtered.map((x) => x.info.map.name));

  let btns = [];

  for (let i = 0; i < filtered.length; i++) {
    let x = filtered[i];

    let servName;

    if (x.info.name.length > 20) {
      servName = x.info.name.slice(0, 20) + "...";
    } else servName = x.info.name;

    // This just doesnt work as expected with the spaces, but whatever
    btns.push(
      `${emojis.fromStr(x.location)} ${servName} ${" ".repeat(
        24 - `${x.info?.name.slice(0, 20)}...`.length
      )} ${emojis.map} ${x.info.map.name} ${" ".repeat(
        longestMap - x.info.map.name.length
      )} ${emojis.person} ${x.info.clients.length} / 64`
    );
  }

  let binds = queryBinds("column");

  // This makes it so it doesnt redraw the page if
  // You try and go back a page/forward when there isnt a page to go to
  if (curPage == 1) {
    binds.LEFT = "";
  }
  if (curPage == maxPage) {
    binds.RIGHT = "";
  }

  let resp = await terminal.singleColumnMenu(
    [
      ...btns,
      "",
      "Previous Page [<-]",
      "Next Page [->]",
      "Change Filter [F]",
      "Query [Q]",
      "Go Back [ESC]",
    ] as string[],
    { cancelable: true, keyBindings: binds }
  ).promise;

  // Cancelled
  if (resp.selectedText == undefined) {
    return;
  }

  if (resp.selectedText == "Go Back [ESC]") {
    terminal.eraseDisplayAbove();
    drawMainMenu();
  } else if (resp.selectedText == "Previous Page [<-]") {
    drawServers(query, { filter: extra.filter, page: curPage - 1, data });
  } else if (resp.selectedText == "Next Page [->]") {
    drawServers(query, { filter: extra.filter, page: curPage + 1, data });
  } else if (resp.selectedText == "Change Filter [F]") {
    let newFilter =
      extra.filter == "none"
        ? "ascending"
        : extra.filter == "ascending"
        ? "descending"
        : "none";
    drawServers(query, { filter: newFilter as any, page: curPage, data });
  } else if (resp.selectedText == "Query [Q]") {
    grabQuery("servers-main", extra);
  } else if (resp.selectedText == "") {
    drawServers(query);
  } else {
    drawSelectedServer(data!, filtered[resp.selectedIndex]);
  }
}

export async function drawSelectedServer(data: ServerData, server: Server) {
  terminal.eraseDisplayAbove();
  terminal.moveTo(1, 1);

  if (!server) {
    let str = ` Error fetching this server... returning to list.`;
    terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
    let sp = await terminal.spinner("impulse");

    terminal.red(str);

    setTimeout(() => {
      sp.animate(false);
      drawServers();
    }, 1000);

    return;
  }

  terminal.green(`Selected Server: ${server.info.name} ${server.location}\n\n`);
  terminal.green(
    `Map: ${server.info.map.name}\nPlayers: ${server.info.clients.length}\n\n`
  );

  let resp = await terminal.singleColumnMenu(["View Clients", "Go Back"], {
    cancelable: true,
    keyBindings: queryBinds("column"),
  }).promise;

  if (resp.selectedText == "Go Back") {
    drawServers();
  } else if (resp.selectedText == "View Clients") {
  }
}

export function registerServerBinds() {
  bindHandler.register("servers-main", "q", () =>
    grabQuery("servers-main", {
      filter: menuTracker.getServerFilter(),
      page: menuTracker.getServerPage(),
      data: menuTracker.getServerData(),
    })
  );

  bindHandler.register("servers-main", "ESCAPE", () => {
    terminal.eraseDisplay();
    drawMainMenu();
  });

  bindHandler.register("servers-main", "f", () => {
    let f = menuTracker.getServerFilter();
    let nf =
      f == "none" ? "ascending" : f == "ascending" ? "descending" : "none";

    drawServers(menuTracker.getServerQuery(), {
      page: menuTracker.getServerPage(),
      filter: nf as any,
      data: menuTracker.getServerData(),
    });
  });

  bindHandler.register("servers-main", "LEFT", () => {
    if (menuTracker.getServerPage() - 1 < 1) return;

    drawServers(menuTracker.getServerQuery(), {
      filter: menuTracker.getServerFilter(),
      page: menuTracker.getServerPage() - 1,
      data: menuTracker.getServerData(),
    });
  });

  bindHandler.register("servers-main", "RIGHT", () => {
    if (menuTracker.serverPage + 1 > menuTracker.serversMaxPage) return;

    drawServers(menuTracker.getServerQuery(), {
      filter: menuTracker.getServerFilter(),
      page: menuTracker.getServerPage() + 1,
      data: menuTracker.getServerData(),
    });
  });
}
