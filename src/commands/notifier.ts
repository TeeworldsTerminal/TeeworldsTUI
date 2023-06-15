import { notify } from "node-notifier";
import { ServerData, friends, getData, registerCommand } from "../index";

let interval: NodeJS.Timer | undefined = undefined;
let cached: { name: string; server: string }[] = [];

registerCommand("notifier", notifierFn);

export function notifierQuit() {
  if (interval) {
    clearInterval(interval);
  }
}

export function notifierFn(data: ServerData, args: string[]) {
  if (!args[0] || !["start", "stop"].includes(args[0])) {
    console.log("Expected Usage: notifier <start|stop>");
    return;
  }

  if (args[0] == "stop") {
    if (!interval) {
      console.log("Notifier is not already started.");
      return;
    }

    clearInterval(interval);
    interval = undefined;
    return;
  }

  if (args[0] == "start") {
    interval = setInterval(notifierInterval, 5000);
  }
}

async function notifierInterval() {
  console.log("notifier interval");
  let data = await getData();

  for (let i = 0; i < data.servers.length; i++) {
    let s = data.servers[i];

    for (let c = 0; c < s.info.clients?.length; c++) {
      let client = s.info.clients[c];

      if (friends.friends.includes(client.name)) {
        let cf = cached.find((x) => x.name == client.name);

        if (!cf) {
          notify({
            title: `${client.name} is playing Teeworlds`,
            message: `Server: ${s.info.name}\nMap: ${s.info.map.name} (${s.info.game_type})`,
          });
          console.log("sending notification");
        }
      }
    }
  }
}
