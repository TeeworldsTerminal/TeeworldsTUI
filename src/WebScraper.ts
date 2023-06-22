import axios from "axios";
import cheerio, { Cheerio, Element } from "cheerio";

export interface FavouritePartners {
  name: string;
  finishes: number;
}

export interface WebScraper {
  playerBaseUrl: string;
  mapBaseUrl: string;
}

export interface LatestFinishes {
  date: Date;
  mapType: string;
  mapName: string;
}

export interface MapInfo {
  difficulty: string;
  stars: string;
  points: number;
  finishes: number;
  teamFinishes: number;
  medianTime: string;
  biggestTeam: number;
}

export interface MapStats {
  info: MapInfo;
  timeRanks: MapTimeRanks[];
  teamRanks: MapTimeRanks[];
  finishRanks: MapFinishesRanks[];
}

export interface MapTimeRanks {
  rank: number;
  time: string;
  player: string;
}

export interface MapFinishesRanks {
  rank: number;
  finishes: number;
  player: string;
}

export type MapDifficulties =
  | "Novice"
  | "Moderate"
  | "Brutal"
  | "Insane"
  | "Dummy"
  | "Solo"
  | "Race"
  | "Fun"
  | "DDmaX.Easy"
  | "DDmaX.Next"
  | "DDmaX.Pro"
  | "DDmaX.Nut"
  | "Oldschool";

export interface PlayerCompletedMapsData {
  difficulty: MapDifficulties;
  totalPoints: number;
  points: number;
  totalMaps: number;
  completedMaps: number;
  maps: PlayerMaps[] | undefined; // annoying fix for now but fksdd;
}

export interface PlayerMaps {
  name: string;
  difficulty: MapDifficulties;
  finished: boolean;
  points: number;
  finishes?: number;
  teamRank?: number;
  rank?: number;
  time?: string;
  firstFinish?: Date;
}

export interface PlayerStats {
  mapData: (PlayerCompletedMapsData | undefined)[]; //annoying fix pt 2;
  completedMaps: number;
  totalMaps: number;
  points: number;
  totalPoints: number;
}

export class WebScraper {
  constructor() {
    this.playerBaseUrl = "https://ddnet.tw/players/";
    this.mapBaseUrl = "https://ddnet.tw/maps/";
  }

  async getMapPage(mapName: string) {
    mapName = mapName.split(" ").join("-32-");
    let { data } = await axios.get(this.mapBaseUrl + mapName);
    return data;
  }

  async getMapStats(mapName: string): Promise<MapStats> {
    const mapData = cheerio.load(await this.getMapPage(mapName));

    let mapType = mapData("div#global > h2 > a").text().split(" ")[0];

    let info = mapData("div#global > div.info");
    let teamRecords = mapData("div#global > div.teamrecords > table > tbody");
    let records = mapData("div#global > div.records > table > tbody");
    let finishes = mapData("div#global > div.finishes > table > tbody");

    let infoArr: string[] = [];
    let teamRecordsArr: MapTimeRanks[] = [];
    let recordsArr: MapTimeRanks[] = [];
    let finishesArr: MapFinishesRanks[] = [];

    teamRecords
      .children()
      .toArray()
      .forEach((child) => {
        let loaded = cheerio.load(child);
        let rank = parseInt(loaded("td.rank").text());
        let time = loaded("td.time").text();
        let player = loaded("td > a").parent().text();

        teamRecordsArr.push({ rank, time, player });
      });

    records
      .children()
      .toArray()
      .forEach((child) => {
        let loaded = cheerio.load(child);
        let rank = parseInt(loaded("td.rank").text());
        let time = loaded("td.time").text();
        let player = loaded("td > a").parent().text();

        recordsArr.push({ rank, time, player });
      });

    finishes
      .children()
      .toArray()
      .forEach((child) => {
        let loaded = cheerio.load(child);
        let rank = parseInt(loaded("td.rank").text());
        let finishes = parseInt(loaded("td.time").text());
        let player = loaded("td > a").text();

        finishesArr.push({ rank, finishes, player });
      });

    info.children()[0].children.forEach((child) => {
      if (child["type"] && child["type"] == "text") {
        infoArr.push(child.data);
      } else if (
        (child as any)?.firstChild &&
        (child as any).firstChild["type"] == "text"
      )
        infoArr.push((child as any).firstChild.data);
    });

    infoArr = infoArr.filter((x) => x.trim() != "");

    //Not all maps have "Released" date in their info blocks (maybe just oldschool servers),
    //So this is used to decide what indexes should be used to get information from the array.
    let p = infoArr[0].includes("Released") ? 1 : 0;

    let mapInfo: MapInfo = {
      difficulty: mapType,
      stars: infoArr[0 + p].split(",")[0].split(" ")[1],
      points: parseInt(infoArr[0 + p].split(",")[1].split(" ")[2]),
      finishes: parseInt(infoArr[1 + p].split(" ")[0]),
      teamFinishes: parseInt(infoArr[2 + p].split(" ")[0]),
      biggestTeam: parseInt(infoArr[2 + p].split(" ")[5]),
      medianTime: infoArr[1 + p].split(" ")[5].replaceAll(")", ""),
    };

    return {
      info: mapInfo,
      timeRanks: recordsArr,
      teamRanks: teamRecordsArr,
      finishRanks: finishesArr,
    };
  }

  async getPlayerPage(playerName: string) {
    playerName = playerName.split(" ").join("-32-");
    let { data } = await axios.get(this.playerBaseUrl + playerName);
    return data;
  }

  parseMaps(
    mapData: Cheerio<Element>,
    mapDifficulty: MapDifficulties
  ): PlayerCompletedMapsData | undefined {
    //depracted suck my ass?
    if (mapData.html() == null) {
      console.log(
        `Aborting parse for difficulty: ${mapDifficulty}. (data is null)`
      );
      return;
    }
    let data = cheerio.load(mapData.html() as string);
    let x = data("h3").toArray();
    let mapsTable = data("div > table > tbody").children();

    let completeMapDataArray: PlayerMaps[] = [];
    let points = 0;

    mapsTable.toArray().forEach((child) => {
      let $ = cheerio.load(child);
      let mapData: string[] = [];

      // $("tr").text() could be possible, but no way to split name / points etc..
      // example output from this ^: Chinatown27402 (name /points etc.. all clumped into one word)
      $("tr")
        .children()
        .toArray()
        .forEach((inner) => {
          if (inner.firstChild)
            mapData.push(cheerio.load(inner.firstChild).text());
        });

      //  console.log($("tr").text());
      // console.log(mapData);

      // Uncompleted maps have less data, ie: finish time
      if (mapData.length == 3) {
        let mapObject: PlayerMaps = {
          name: mapData[0],
          finished: false,
          points: parseInt(mapData[1]),
          difficulty: mapDifficulty,
        };

        completeMapDataArray.push(mapObject);
      } else {
        let mapObject: PlayerMaps = {
          name: mapData[0],
          difficulty: mapDifficulty,
          points: parseInt(mapData[1]),
          finished: true,
        };
        // No team rank provided for the map
        if (mapData.length == 6) {
          mapObject.teamRank = -1;
          mapObject.rank = parseInt(mapData[2]);
          mapObject.time = mapData[3];
          mapObject.finishes = parseInt(mapData[4]);
          mapObject.firstFinish = new Date(mapData[5].split(",").join(""));
        } else {
          mapObject.teamRank = parseInt(mapData[2]);
          mapObject.rank = parseInt(mapData[3]);
          mapObject.time = mapData[4];
          mapObject.finishes = parseInt(mapData[5]);
          mapObject.firstFinish = new Date(mapData[6].split(",").join(""));
        }
        points += parseInt(mapData[1]);
        completeMapDataArray.push(mapObject);
      }
    });

    let cm = (x[0].children[0] as any)?.data;
    let completedMapCount = parseInt(cm.split("/")[0].slice(1));
    let totalMapCount = parseInt(cm.split("/")[1].split(" ")[0]);
    let totalPoints = parseInt(
      (x[1].children[0] as any)?.data.split("(")[1].split(" ")[0]
    );

    return {
      difficulty: mapDifficulty,
      points: points,
      totalPoints: totalPoints,
      totalMaps: totalMapCount,
      completedMaps: completedMapCount,
      maps: completeMapDataArray,
    };
  }

  async getNoviceMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Novice"), "Novice");

    return parsed;
  }

  async getModerateMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Moderate"), "Moderate");

    return parsed;
  }

  async getBrutalMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Brutal"), "Brutal");

    return parsed;
  }

  async getInsaneMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Insane"), "Insane");
    return parsed;
  }

  async getDummyMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Dummy"), "Dummy");

    return parsed;
  }

  // Decided to split ddmax into sep functions since website has done the same thing

  async getDDmaXMaps(playerName: string, data: any = null) {
    return [
      await this.getDDmaXEasyMaps(playerName, data),
      await this.getDDmaXNextMaps(playerName, data),
      await this.getDDmaXProMaps(playerName, data),
      await this.getDDmaXNutMaps(playerName, data),
    ];
  }

  async getDDmaXEasyMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));

    let parsed = this.parseMaps($("div#DDmaX\\.Easy"), "DDmaX.Easy");
    return parsed;
  }

  async getDDmaXNextMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));

    let parsed = this.parseMaps($("div#DDmaX\\.Next"), "DDmaX.Next");
    return parsed;
  }

  async getDDmaXProMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));

    let parsed = this.parseMaps($("div#DDmaX\\.Pro"), "DDmaX.Pro");
    return parsed;
  }

  async getDDmaXNutMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));

    let parsed = this.parseMaps($("div#DDmaX\\.Nut"), "DDmaX.Nut");
    return parsed;
  }

  async getOldschoolMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Oldschool"), "Oldschool");

    return parsed;
  }

  async getSoloMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Solo"), "Solo");
    return parsed;
  }

  async getRaceMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Race"), "Race");
    return parsed;
  }

  async getFunMaps(playerName: string, data: any = null) {
    let $ = cheerio.load(data ?? (await this.getPlayerPage(playerName)));
    let parsed = this.parseMaps($("div#Fun"), "Fun");

    return parsed;
  }

  async getPlayerStats(playerName: string): Promise<PlayerStats> {
    let data = await this.getPlayerPage(playerName);

    let mapData = [
      await this.getNoviceMaps(playerName, data),
      await this.getModerateMaps(playerName, data),
      await this.getInsaneMaps(playerName, data),
      await this.getBrutalMaps(playerName, data),
      await this.getDummyMaps(playerName, data),
      ...(await this.getDDmaXMaps(playerName, data)),
      await this.getOldschoolMaps(playerName, data),
      await this.getSoloMaps(playerName, data),
      await this.getRaceMaps(playerName, data),
      await this.getFunMaps(playerName, data),
    ];

    let totalCompleted = mapData.reduce(
      (p, c) => p + (c?.completedMaps || 0),
      0
    );
    let totalMaps = mapData.reduce((p, c) => p + (c?.totalMaps ?? 0), 0);
    let points = mapData.reduce((p, c) => p + (c?.points ?? 0), 0);
    let totalPoints = mapData.reduce((p, c) => p + (c?.totalPoints ?? 0), 0);

    return {
      mapData: mapData,
      completedMaps: totalCompleted,
      totalMaps: totalMaps,
      points: points,
      totalPoints: totalPoints,
    };
  }

  async getLatestFavouriteHtml(playerName: string) {
    let data = await this.getPlayerPage(playerName);
    let $ = cheerio.load(data);

    let x = [...$("div#global").children()].filter(
      (x) => x.attribs.class == "block6 ladder"
    );

    return cheerio.load(x);
  }

  async getLatestFinishes(playerName: string): Promise<LatestFinishes[]> {
    let data = await this.getLatestFavouriteHtml(playerName);

    let divs = data("div").toArray();

    let table = cheerio.load(divs[0])("table > tbody").children().toArray();

    let scraped: LatestFinishes[] = [];

    table.forEach((child) => {
      let x = cheerio.load(child);

      let finishInfoString = x("td")
        .children()
        .toArray()
        .map((inner) => {
          if (inner.firstChild)
            return (
              (inner.firstChild as any)?.data + " " + (inner.next as any)?.data
            );
        })
        .join(" ");

      let finishInfo = finishInfoString
        .trim()
        .split(" ")
        .filter((x) => x != ":" && x != "");

      let date = new Date(finishInfo[0] + " " + finishInfo[1]);
      let mapName = finishInfo.slice(3, finishInfo.length).join(" ");

      let finishInfoObj: LatestFinishes = {
        date: date,
        mapType: finishInfo[2],
        mapName: mapName,
      };

      scraped.push(finishInfoObj);
    });

    return scraped;
  }

  async getFavouritePartners(playerName: string): Promise<FavouritePartners[]> {
    let data = await this.getLatestFavouriteHtml(playerName);

    let divs = data("div").toArray();

    let table = cheerio.load(divs[1])("table > tbody").children().toArray();
    let scraped: FavouritePartners[] = [];

    table.forEach((child) => {
      let x = cheerio.load(child);
      let favouritePartnersString = x("td")
        .children()
        .toArray()
        .map((inner) => {
          if (inner.firstChild)
            return (
              (inner.firstChild as any)?.data + " " + (inner.next as any)?.data
            );
        })
        .join("");

      scraped.push({
        name: favouritePartnersString.split(":")[0].trim(),
        finishes: parseInt(favouritePartnersString.split(":")[1]),
      } as FavouritePartners);
    });

    return scraped;
  }
}
