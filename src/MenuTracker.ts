import { ServerData } from ".";

export class MenuTracker {
  currentMenu: string = "main";
  previousMenu: string = "main";
  friendsPage: number = 0;
  friendsQuery: string = "";
  serverQuery: string = "";
  serverFilter: "none" | "ascending" | "descending" = "none";
  serverPage: number = 0;
  serverData?: ServerData;

  setServerData(data: ServerData) {
    this.serverData = data;
    return this;
  }

  getServerData() {
    return this.serverData;
  }

  setServerPage(page: number) {
    this.serverPage = page;
    return this;
  }

  getServerPage() {
    return this.serverPage;
  }

  setServerQuery(query: string) {
    this.serverQuery = query;
    return this;
  }

  getServerQuery() {
    return this.serverQuery;
  }

  setServerFilter(filter: "none" | "ascending" | "descending") {
    this.serverFilter = filter;
    return this;
  }

  getServerFilter() {
    return this.serverFilter;
  }

  setMenu(menu: string) {
    this.currentMenu = menu;
    return this;
  }

  setFriendsQuery(query: string) {
    this.friendsQuery = query;
    return this;
  }

  getFriendsQuery() {
    return this.friendsQuery;
  }

  setFriendsPage(page: number) {
    this.friendsPage = page;
    return this;
  }

  setPreviousMenu(menu: string) {
    this.previousMenu = menu;
    return this;
  }

  getPreviousMenu() {
    return this.previousMenu;
  }

  getFriendsPage() {
    return this.friendsPage;
  }

  getMenu() {
    return this.currentMenu;
  }
}
