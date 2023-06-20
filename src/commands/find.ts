import { ServerData, commandHandler, getData } from "..";

commandHandler.register("find", find, {
  aliases: ["find"],
  replCb: findRepl,
});

export async function find(args: string[]) {
  if (args.length < 2) {
    console.log(`Expected Usage: find <player|map> [name]`);
    return;
  }

  let data = (await getData("server")) as ServerData;

  if (args[0] == "player") {
    let name = args[1];

    let server = data.servers.find((x) =>
      x.info.clients?.find((y) => y.name == name)
    );

    if (!server) {
      console.log(`${name} is currently offline :(`);
    } else {
      console.log(
        `${name}: Online\n${server.info.name}\n${server.info.map.name}\n${server.info.game_type}`
      );
    }
  }

  if (args[0] == "clan") {
    let clan = args[1];

    let string = "";

    for (let i = 0; i < data.servers.length; i++) {
      let serv = data.servers[i];
      for (let c = 0; c < serv.info.clients.length; c++) {
        let client = serv.info.clients[c];

        if (client.clan == clan)
          string += `(${clan}) ${client.name} - ${serv.info.map.name} (${serv.info.game_type})\n`;
      }
    }

    if (string == "") {
      console.log(`No clan members for ${clan} found.`);
    } else {
      console.log(`Clan "${clan}" Members: `);
      console.log(string);
    }
  }
}

export async function findRepl(args: string[]) {
  if (args.length < 2) {
    return {
      success: false,
      message: `Expected Usage: find <player|map> [name]`,
    };
  }

  let data = (await getData("server")) as ServerData;

  if (args[0] == "player") {
    let name = args[1];

    let server = data.servers.find((x) =>
      x.info.clients?.find((y) => y.name == name)
    );

    if (!server) {
      return { success: true, message: `${name} is currently offline :(` };
    } else {
      return {
        success: true,
        message: `${name}: Online\n${server.info.name}\n${server.info.map.name}\n${server.info.game_type}`,
      };
    }
  }

  if (args[0] == "clan") {
    let clan = args[1];

    let string = "";

    for (let i = 0; i < data.servers.length; i++) {
      let serv = data.servers[i];
      for (let c = 0; c < serv.info.clients.length; c++) {
        let client = serv.info.clients[c];

        if (client.clan == clan)
          string += `(${clan}) ${client.name} - ${serv.info.map.name} (${serv.info.game_type})\n`;
      }
    }

    if (string == "") {
      return {
        success: true,
        message: `No clan members for ${clan} found online. :(`,
      };
    } else {
      return {
        success: true,
        message: `Clan "${clan}" Members:\n${string}`,
      };
    }
  }

  return { success: false, message: `Invalid command usage.` };
}
