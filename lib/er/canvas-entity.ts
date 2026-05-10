// biome-ignore lint/complexity/noStaticOnlyClass: base entity utility
export class CanvasEntity {
  static fromRaw<T extends CanvasEntity>(Ctor: new () => T, raw: unknown): T {
    const instance = new Ctor();

    const assignRecursive = (target: any, source: any) => {
      if (!source || typeof source !== "object") {
        return;
      }

      for (const key of Object.keys(source)) {
        const value = source[key];

        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          target[key] = {};
          assignRecursive(target[key], value);
        } else if (Array.isArray(value)) {
          target[key] = value.map((item) => {
            if (
              item !== null &&
              typeof item === "object" &&
              !Array.isArray(item)
            ) {
              const nested: Record<string, unknown> = {};
              assignRecursive(nested, item);
              return nested;
            }

            return item;
          });
        } else {
          target[key] = value;
        }
      }
    };

    assignRecursive(instance, raw);

    return instance;
  }
}
