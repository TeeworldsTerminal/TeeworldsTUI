import { notify } from "node-notifier";
import { ServerData, commandHandler, friends, getData } from "../index";

let interval: NodeJS.Timer | undefined = undefined;
let cached: { name: string; servers: { name: string; address: string }[] }[] =
  [];

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

// TODO: clean this shit up
// Originally i was using name to identify server, which makes no sense
// So im now using server address, although servers have an array of addresses
// Typically 2 in each array, so im just using the first in the array.
async function notifierInterval() {
  let data = (await getData("server")) as ServerData;

  for (let i = 0; i < data.servers.length; i++) {
    let server = data.servers[i];

    for (let x = 0; x < cached.length; x++) {
      let cachedX = cached[x];

      if (
        cachedX.servers.find((f) => f.address == server.addresses[0]) !==
        undefined &&
        server.info.clients.find((sc) => sc.name == cachedX.name) == undefined
      ) {
        cachedX.servers = cachedX.servers.filter(
          (f) => f.address != server.addresses[0]
        );

        if (cachedX.servers.length == 0) {
          cached.splice(x, 1);
        }
      }
    }

    for (let c = 0; c < server.info.clients?.length; c++) {
      let client = server.info.clients[c];

      if (friends.friends.includes(client.name)) {
        let cf = cached.find((x) => x.name == client.name);

        if (!cf) {
          notify({
            title: `${client.name} is playing Teeworlds`,
            message: `Server: ${server.info.name}\nMap: ${server.info.map.name} (${server.info.game_type})`,
          });

          cached.push({
            name: client.name,
            servers: [{ name: server.info.name, address: server.addresses[0] }],
          });
        } else {
          if (!cf.servers.find((z) => z.address == server.addresses[0])) {
            notify({
              title: `${client.name} is playing Teeworlds`,
              message: `Server: ${server.info.name}\nMap: ${server.info.map.name} (${server.info.game_type})`,
            });

            cf.servers.push({
              name: server.info.name,
              address: server.addresses[0],
            });
          }
        }
      }
    }
  }
}
