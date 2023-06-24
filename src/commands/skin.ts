// Expiremental shit + will also only work on Kitty terminal afiak

import { ColorCode, PersonalCard, Skin, SkinPart } from "teeworlds-utilities";
import { ServerData, commandHandler, getData } from "..";
import { getServerClient } from "../utils";
import path from "path";
import { unlinkSync, writeFileSync } from "fs";
import { exec, execSync } from "child_process";

commandHandler.register("skin", skin, {});

export async function skin(args: string[]) {
  if (!args[0]) {
    console.log("bla bla bla expected usage and shit");
    return;
  }

  let data = (await getData("server")) as ServerData;

  let p = getServerClient(data, args[0]);

  if (!p) {
    console.log(`${args[0]} is not online.`);
    return;
  }

  let baseUrl = "https://ddnet.org/skins/skin/community";

  let skin = new Skin();

  let tmpPath = path.join(__dirname, "..", `${p.skin.name}-tmp.png`);

  writeFileSync(
    tmpPath,
    new Uint8Array(
      await (await fetch(`${baseUrl}/${p!.skin.name}.png`)).arrayBuffer()
    )
  );

  await skin.loadFromPath(tmpPath);

  unlinkSync(tmpPath);

  if (p.skin.color_body)
    skin.colorPart(new ColorCode(p.skin.color_body), SkinPart.BODY);
  // This errors dont know why and dont care
  // if (p.skin.color_feet)
  //   skin.colorPart(new ColorCode(p.skin.color_feet), SkinPart.FOOT);

  skin.render().saveRenderAs(`${p.skin.name}.png`);

  let rendered = path.join(__dirname, "..", "..", `render_${p.skin.name}.png`);

  let cmd = `kitty +kitten icat ${rendered}`;

  execSync(cmd, { stdio: "inherit" });

  // Deleting too soon will cause kitty to not display image properly? gr
  setTimeout(() => {
    unlinkSync(rendered);
  }, 500);
}
