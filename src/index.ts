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

export type DataTypes = ServerData;

let args = process.argv.splice(2);
let commands = ["find", "friends", "repl", "notifier"];

let serverUrl = "https://master1.ddnet.org/ddnet/15/servers.json";

export let friends = setupJSON();

let help = `
--- Teeworlds CLI ---


  commands:
    - find
      - player
        [name]
      - map
        [name]
`;

export let commandHandler = new CommandHandler();

async function main() {
  await commandHandler.loadCommands(path.join(__dirname, "commands")); //todo: move this after args.length check

  if (!args.length || !commands.includes(args[0].toLowerCase())) {
    console.log(help);
    process.exit(1);
  }

  handle(args);
}

// Turn dtype into an enum??
export async function getData(
  dType: "server" | "NOT_IMPLEMENTED"
): Promise<DataTypes | undefined> {
  if (dType == "server")
    return (await (await fetch(serverUrl)).json()) as ServerData;
}

export async function handle(
  args: string[],
  repl?: boolean
): Promise<{ success: boolean; message: string } | void> {
  return await commandHandler.run(args[0], args.splice(1), repl);
}

main();
