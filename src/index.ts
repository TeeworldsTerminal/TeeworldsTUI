import { setupJSON } from "./utils";

export type ServerData = {
  servers: {
    name: string;
    info: {
      map: { name: string };
      clients: { name: string; clan: string; team: 0 }[];
      game_type: string;
    };
  }[];
};

let args = process.argv.splice(2);
let commands = ["find", "friends", "repl"];

let serverUrl = "https://master1.ddnet.org/ddnet/15/servers.json";

export let friends = setupJSON();

export let commandMap: Map<
  string,
  // Alot more data + this isnt always gaurenteed data since
  // will probably add other endpoints eventually
  (data: ServerData, args: string[]) => void
> = new Map();

let help = `
--- Teeworlds CLI ---


  commands:
    - find
      - player
        [name]
      - map
        [name]
`;

if (!args.length || !commands.includes(args[0].toLowerCase())) {
  console.log(help);
  process.exit(1);
}

export function registerCommand(
  name: string,
  cb: (data: ServerData, args: string[]) => void
) {
  commandMap.set(name, cb);
}

async function main() {
  handle(args);
}

export async function handle(args: string[]) {
  let data = await (await fetch(serverUrl)).json();

  commandMap.get(args[0])?.(data, args.splice(1));
}

// looks so ugly but cba to setup a command handler shit grr
require("./commands/find");
require("./commands/friends");
require("./commands/repl");

main();
