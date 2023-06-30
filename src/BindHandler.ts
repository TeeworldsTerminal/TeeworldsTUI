export class BindHandler {
  menuBinds = new Map<string, Map<string, () => any>>();

  register(menu: string, key: string, fn: () => any) {
    let x = this.menuBinds.get(menu);

    if (!x) {
      let y = new Map();
      y.set(key, fn);
      this.menuBinds.set(menu, y);
      return;
    }

    x.set(key, fn);
  }

  runBind(menu: string, key: string) {
    this.menuBinds.get(menu)?.get(key)?.();
  }
}
