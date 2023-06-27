import { terminal } from "terminal-kit";
import { ServerData, drawMainMenu, getData, menuTracker } from "..";
import { queryBinds } from "../utils";

export async function drawServers(query = "") {
  menuTracker.setMenu("servers-main");

  terminal.eraseDisplayAbove();
  let str = ` Fetching server list...`;

  terminal.moveTo(terminal.width / 2 - str.length / 2, terminal.height / 2);
  let sp = await terminal.spinner("impulse");
  terminal.green(str);

  let data = await getData("server");

  sp.animate(false);
  terminal.eraseDisplayAbove();
  terminal.moveTo(1, 1);

  let filtered =
    query == ""
      ? data?.servers
      : data?.servers.filter((x) =>
          `${x.info.name} (::) ${x.info.map?.name} (::) ${x.info.clients?.length} / 64 (::) ${x.addresses[0]}`.includes(
            query
          )
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
      "Go Back",
    ] as string[],
    { cancelable: true, keyBindings: queryBinds("column") }
  ).promise;

  // Cancelled
  if (resp.selectedText == undefined) {
    return;
  }

  if (resp.selectedText == "Go Back") {
    terminal.eraseDisplayAbove();
    drawMainMenu();
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
