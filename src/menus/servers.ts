import { terminal } from "terminal-kit";
import { ServerData, drawMainMenu, getData, menuTracker } from "..";
import { queryBinds } from "../utils";
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
  menuTracker.setServerPage(curPage);

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

  let resp = await terminal.singleColumnMenu(
    [
      ...filtered!.map(
        (x) =>
          `${x.info?.name} (::) ${x.info.map?.name} (::) ${x.info.clients?.length} / 64 (::) ${x.addresses[0]}`
      ),
      "",
      "Previous Page [<-]",
      "Next Page [->]",
      "Change Filter [F]",
      "Query [Q]",
      "Go Back [ESC]",
    ] as string[],
    { cancelable: true, keyBindings: queryBinds("column") }
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
    drawSelectedServer(data!, resp.selectedText);
  }
}

export async function drawSelectedServer(data: ServerData, name: string) {
  terminal.eraseDisplayAbove();
  terminal.moveTo(1, 1);

  let addr = name.split("(::)")[3].trim();

  let server = data.servers.find((x) => x.addresses.includes(addr));

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

  terminal.green(`Selected Server: ${server.info.name}\n\n`);
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

export function handleServersBinds(name: string) {
  let filter = menuTracker.getServerFilter();
  let page = menuTracker.getServerPage();
  let data = menuTracker.getServerData();
  if (name == "q") {
    grabQuery("servers-main", { filter, page, data });
  } else if (name == "ESCAPE") {
    terminal.eraseDisplay();
    drawMainMenu();
  } else if (name == "f") {
    let nf =
      filter == "none"
        ? "ascending"
        : filter == "ascending"
        ? "descending"
        : "none";
    drawServers(menuTracker.getServerQuery(), {
      page,
      filter: nf as any,
      data,
    });
  } else if (name == "LEFT") {
    drawServers(menuTracker.getServerQuery(), { filter, page: page - 1, data });
  } else if (name == "RIGHT") {
    drawServers(menuTracker.getServerQuery(), { filter, page: page + 1, data });
  }
}
