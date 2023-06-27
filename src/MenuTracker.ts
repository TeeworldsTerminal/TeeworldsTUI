export class MenuTracker {
  currentMenu: string = "main";

  setMenu(menu: string) {
    this.currentMenu = menu;
    return this;
  }

  getMenu() {
    return this.currentMenu;
  }
}
