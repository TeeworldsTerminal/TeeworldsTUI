import { ServerData, commandHandler, handle } from "..";
import { splitSpace } from "../utils";
import { notifierQuit } from "./notifier";
import { terminal } from "terminal-kit";

commandHandler.register("repl", repl, { aliases: ["r"] });

export async function repl(args: string[], f?: boolean) {
  if (!f) console.log("type exit to quit repl.");

  terminal.inputField(async (_, q) => {
    if (q == "exit") {
      notifierQuit();
      process.exit();
    }

    terminal.eraseLine();
    terminal.move(-1000, 0); // couldnt find a clean way to actually move to pos 0 so fuck it

    terminal("Processing command...");

    let start = new Date().getUTCMilliseconds();

    let resp = (await handle(splitSpace(q) ?? [], true)) as {
      success: boolean;
      message: string;
    };

    let timeTaken = new Date().getUTCMilliseconds() - start;

    terminal.eraseLine();
    terminal.move(-1000, 0);

    if (resp?.success) {
      terminal.green(`Ran ${q} - success`).yellow(`   ~${timeTaken / 1000}s`);
    } else {
      terminal.red(`Ran ${q} - failed`).yellow(`   ~${timeTaken / 1000}s`);
    }

    terminal(
      "\n\n \x1b[33m ------------------------------------------ \x1b[0m \n\n"
    );

    terminal(resp?.message || "No response was provided");

    terminal(
      "\n\n \x1b[33m ------------------------------------------ \x1b[0m \n"
    );

    repl(args, true);
  });
}
