import { existsSync, writeFileSync } from "fs";
import path from "path";

export type JsonLayout = {
  friends: string[];
  clans: string[];
};

export function setupJSON() {
  let jsonPath = path.join(__dirname, "../config.json");

  if (existsSync(jsonPath)) {
    return require(jsonPath) as JsonLayout;
  } else {
    writeFileSync(jsonPath, JSON.stringify({ friends: [], clans: [] }));
    return { friends: [], clans: [] } as JsonLayout;
  }
}

// No error handling because im lazy
export function writeFriends(friends: JsonLayout) {
  writeFileSync(
    path.join(__dirname, "../config.json"),
    JSON.stringify(friends)
  );
}
