import { Interface } from "readline/promises";
import { ServerData, handle, registerCommand } from "..";
import { createInterface } from "node:readline/promises";
import { clearLine, cursorTo } from "node:readline";

registerCommand("repl", repl);

export async function repl(
  data: ServerData,
  args: string[],
  inter?: Interface
) {
  const rl =
    inter ?? createInterface({ input: process.stdin, output: process.stdout });

  if (!inter) console.log("type exit to quit repl.");

  let q = await rl.question("");

  if (q == "exit") {
    rl.close();
    return;
  }

  console.log(
    "\n \x1b[33m ------------------------------------------ \x1b[0m \n"
  );

  await handle(
    q.match(/"[^"]+"|\S+/g)?.map((m) => m.replace(/^"(.*)"$/, "$1")) ?? []
  );

  console.log(
    "\n \x1b[33m ------------------------------------------ \x1b[0m \n"
  );

  repl(data, args, rl);
}
