import { ServerData, Servers } from ".";

export class MenuTracker {
  currentMenu: string = "main";
  previousMenu: string = "main";
  friendsPage: number = 0;
  friendsQuery: string = "";
  friendsMaxPerPage: number = 0;
  friendsFilteredData: string[] = [];

  serversFilteredData: Servers[] = [];
  serverQuery: string = "";
  serverFilter: "none" | "ascending" | "descending" = "none";
  serverPage: number = 0;
  serverData?: ServerData;
  serversMaxPerPage = 0;

  setFriendsFilteredData(data: string[]) {
    this.friendsFilteredData = data;
    return this;
  }

  getFriendsFilteredData() {
    return this.friendsFilteredData;
  }

  setFriendsMaxPerPage(max: number) {
    this.friendsMaxPerPage = max;
    return this;
  }

  getFriendsMaxPerPage() {
    return this.friendsMaxPerPage;
  }

  setServersFilteredData(data: Servers[]) {
    this.serversFilteredData = data;
    return this;
  }

  getServersFilteredData() {
    return this.serversFilteredData;
  }

  setServersMaxPerPage(max: number) {
    this.serversMaxPerPage = max;
    return this;
  }

  getServersMaxPerPage() {
    return this.serversMaxPerPage;
  }

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
