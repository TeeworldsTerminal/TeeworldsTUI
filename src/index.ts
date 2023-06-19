import path from "path";
import { CommandHandler } from "./commandsHandler";
import { setupJSON } from "./utils";

export type ServerData = {
  servers: {
    info: {
      name: string;
      map: { name: string };
      clients: { name: string; clan: string; team: 0 }[];
      game_type: string;
    };
  }[];
};

let args = process.argv.splice(2);
let commands = ["find", "friends", "repl", "notifier"];

let serverUrl = "https://master1.ddnet.org/ddnet/15/servers.json";

export let friends = setupJSON();

export let commandMap: Map<
  string,
  // Alot more data + this isnt always gaurenteed data since
  // will probably add other endpoints eventually
  (
    data: ServerData,
    args: string[],
    repl?: boolean
  ) => { message: string; success: boolean } | void | Promise<void> //its a fucking shit show
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

export function registerCommand(
  name: string,
  cb: (
    data: ServerData,
    args: string[],
    repl?: boolean
  ) => { message: string; success: boolean } | void | Promise<void>
) {
  commandMap.set(name, cb);
}

export let commandHandler = new CommandHandler();

async function main() {
  await commandHandler.loadCommands(path.join(__dirname, "commands")); //todo: move this after args.length check

  if (!args.length || !commands.includes(args[0].toLowerCase())) {
    console.log(help);
    process.exit(1);
  }

  handle(args);
}

export async function getData() {
  return (await (await fetch(serverUrl)).json()) as ServerData;
}

export async function handle(
  args: string[],
  repl?: boolean
): Promise<{ success: boolean; message: string } | void> {
  let data = await getData();

  return commandHandler.run(args[0], data, args.splice(1), repl);
}

main();
