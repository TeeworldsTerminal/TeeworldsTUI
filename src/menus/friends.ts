import { terminal } from "terminal-kit";
import { ServerData, drawMainMenu, friends, getData } from "..";

export function drawFriendsMenu() {
  terminal.eraseDisplayAbove();

  terminal.singleColumnMenu(
    [
      ...friends.friends,
      "",
      "Add New Friend",
      "",
      "Import Friends",
      "",
      "Back To Main",
    ],
    (err, resp) => {
      if (resp.selectedText == "Back To Main") {
        terminal.eraseDisplayAbove();
        drawMainMenu();
        return;
      } else if (resp.selectedText == "") {
        terminal.eraseDisplayAbove();
        drawFriendsMenu();
        return;
      } else if (resp.selectedText == "Import Friends") {
      } else if (friends.friends.includes(resp.selectedText)) {
        drawSelectedUser(resp.selectedText);
      }
    }
  );
}

export async function drawSelectedUser(name: string, data?: ServerData) {
  terminal.eraseDisplayAbove();

  let spinner = await terminal.spinner();
  terminal.green(" Fetching server data...");

  data = data ?? ((await getData("server")) as ServerData);

  spinner.animate(false);
  terminal.eraseDisplayAbove();

  // Same shit again with cursor idk
  terminal.moveTo([-1000, 0]);

  let server = data.servers.find((x) =>
    x.info.clients.find((c) => c.name == name)
  );

  terminal.green(`Selected User: ${name}\n`);
  (server &&
    terminal.green(
      `Playing: ${server.info.map.name} (${server.info.game_type})\n\n`
    )) ||
    terminal.red("Offline\n\n");

  terminal.singleColumnMenu(
    [
      friends.friends.includes(name) ? "Remove Friend" : "Add Friend",
      "Stats",
      "",
      "Back To Friends",
    ],
    (err, resp) => {
      switch (resp.selectedText) {
        case "": {
          drawSelectedUser(name, data);
          return;
        }
        case "Back To Friends": {
          drawFriendsMenu();
          break;
        }
      }
    }
  );
}
