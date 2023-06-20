import { notify } from "node-notifier";
import { ServerData, commandHandler, friends, getData } from "../index";

let interval: NodeJS.Timer | undefined = undefined;
let cached: { name: string; server: string }[] = [];

commandHandler.register("notifier", notifierFn, {
  aliases: ["s"],
  replCb: notiferFnRepl,
});

export function notifierQuit() {
  if (interval) {
    clearInterval(interval);
  }
}

export function notifierFn(args: string[]) {
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
    if (interval) {
      console.log("Notifier is already started.");
      return;
    }

    interval = setInterval(notifierInterval, 60000);
  }
}

export async function notiferFnRepl(args: string[]) {
  if (!args[0] || !["start", "stop"].includes(args[0]))
    return {
      success: false,
      message: "Expected Usage: notifier <start|stop>",
    };

  if (args[0] == "stop") {
    if (!interval) {
      return { success: false, message: "Notifier is not already started." };
    }

    clearInterval(interval);
    interval = undefined;
    return { success: true, message: "Notifier has been disabled." };
  }

  if (args[0] == "start") {
    if (interval)
      return { success: false, message: "Notifier is already started." };

    interval = setInterval(notifierInterval, 60000);

    return { success: true, message: "Notifier has started." };
  }
}

async function notifierInterval() {
  let data = (await getData("server")) as ServerData;

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

          cached.push({ name: client.name, server: s.info.name });
        } else {
          if (s.info.name != cf.server) {
            notify({
              title: `${client.name} is playing Teeworlds`,
              message: `Server: ${s.info.name}\nMap: ${s.info.map.name} (${s.info.game_type})`,
            });

            cf.server = s.info.name;
          }
        }
      }
    }
  }
}
