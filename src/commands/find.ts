import { ServerData, registerCommand } from "..";

registerCommand("find", find);

export function find(data: ServerData, args: string[]) {
  if (args.length < 2) {
    console.log(`Expected Usage: find <player|map> [name]`);
    return;
  }

  if (args[0] == "player") {
    let name = args[1];

    let server = data.servers.find((x) =>
      x.info.clients?.find((y) => y.name == name)
    );

    if (!server) {
      console.log("Player is not online.");
    } else {
      console.log(server);
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
