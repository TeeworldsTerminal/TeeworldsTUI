import { commandHandler, webScraper } from "..";

commandHandler.register("player", playerStats, {});

export async function playerStats(args: string[]) {
  if (!args[0]) {
    console.log('Expected Usage: tw player "Wocket Woo"');
    return;
  }

  let data = await webScraper.getPlayerStats(args[0]);

  let mstr = data.mapData
    .map(
      (x) =>
        `Difficulty: ${x?.difficulty}\nMaps: ${x?.completedMaps} / ${x?.totalMaps} (${x?.points} / ${x?.totalPoints} pts)`
    )
    .join("\n");

  console.log(`Player Stats: ${args[0]}
Points: ${data.points} / ${data.totalPoints}
Maps: ${data.completedMaps} / ${data.totalMaps}
${mstr}
`);
}
