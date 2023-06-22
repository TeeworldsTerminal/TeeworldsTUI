import { terminal } from "terminal-kit";
import { ServerData, commandHandler, friends, getData } from "..";
import { writeFriends } from "../utils";
import { playerStats } from "./player";

commandHandler.register("friends", friendsFn, {
  aliases: ["fr"],
  replCb: friendsFnRepl,
});

async function expirimentalFriends(args: string[]) {
  terminal.singleColumnMenu(friends.friends, (err, resp) => {
    terminal.eraseDisplayAbove();

    terminal(`Selected: ${resp.selectedText}\n\n`);

    terminal.singleColumnMenu(["Remove", "Stats"], async (err, respi) => {
      if (respi.selectedText == "Stats") {
        terminal("\n\n");

        terminal.eraseDisplayAbove();

        await playerStats([resp.selectedText]);

        process.exit();
      }
    });
  });
}

export async function friendsFn(args: string[]) {
  if (args[0] && args[0] === "expiremental") {
    expirimentalFriends(args);
    return;
  }

  if (!args[0]) {
    console.log(`expected usage: friends <add|remove|list> [name?]`);
    return;
  }

  let data = (await getData("server")) as ServerData;

  if (args[0] == "add") {
    if (!args[1]) {
      console.log(`expected usage: friends <add|remove|list> [name?]`);
      return;
    }

    if (friends.friends.includes(args[1])) {
      console.log(`Already having ${args[1]} added as a friend.`);
      return;
    }

    friends.friends.push(args[1]);
    writeFriends(friends);
    console.log(`Added ${args[1]} as a friend.`);
    return;
  } else if (args[0] == "remove") {
    if (!args[1]) {
      console.log(`expected usage: friends <add|remove|list> [name?]`);
      return;
    }

    if (!friends.friends.includes(args[1])) {
      console.log(`${args[1]} is not added as a friend.`);
      return;
    }

    friends.friends = friends.friends.filter((x) => x != args[1]);
    writeFriends(friends);

    console.log(`${args[1]} was removed as a friend.`);
    return;
  } else if (args[0] == "list") {
    console.log(friendsString(data));
  }
}

export async function friendsFnRepl(args: string[]) {
  if (!args[0]) {
    return {
      success: false,
      message: "expected usage: friends <add|remove|list> [name?]",
    };
  }

  let data = (await getData("server")) as ServerData;

  if (args[0] == "add") {
    if (!args[1]) {
      return {
        success: false,
        message: "expected usage: friends <add|remove|list> [name?]",
      };
    }

    if (friends.friends.includes(args[1])) {
      return {
        success: false,
        message: `Already have ${args[1]} added as a friend.`,
      };
    }

    friends.friends.push(args[1]);
    writeFriends(friends);
    return { success: true, message: `Added ${args[1]} as a friend` };
  } else if (args[0] == "remove") {
    if (!args[1]) {
      return {
        success: false,
        message: "expected usage: friends <add|remove|list> [name?]",
      };
    }

    if (!friends.friends.includes(args[1])) {
      return {
        success: false,
        message: `${args[1]} is not added as a friend.`,
      };
    }

    friends.friends = friends.friends.filter((x) => x != args[1]);
    writeFriends(friends);

    return { success: true, message: `${args[1]} was removed as a friend.` };
  } else if (args[0] == "list") {
    return { success: true, message: friendsString(data) };
  }
}

function friendsString(data: ServerData) {
  let string = "";

  let fClone = [...friends.friends];

  for (let i = 0; i < data.servers.length; i++) {
    let s = data.servers[i];

    if (!s.info.clients) continue;

    for (let c = 0; c < s.info.clients.length; c++) {
      let client = s.info.clients[c];

      if (friends.friends.includes(client.name)) {
        string += `${client.name} - ${s.info.map.name} (${s.info.game_type})\n`;
        fClone.splice(fClone.indexOf(client.name), 1); // how did i fuck this up before!?!?!?
      }
    }
  }

  for (let i = 0; i < fClone.length; i++) {
    string += `${fClone[i]} - Offline\n`;
  }

  return string;
}
