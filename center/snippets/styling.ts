import classnames from "classnames";

export const cx = classnames;

export type CxDef = Array<
  string | { [key: string]: boolean } | null | undefined
>;
export type CxDefPlus = Array<
  string | CxDef[] | { [key: string]: boolean } | null | undefined
>;

// Wrapper for classic classnames
export function c(node: HTMLElement, classes: CxDef) {
  node.className = classnames(...classes);

  return {
    update(
      newClasses: Array<string | { [key: string]: boolean } | null | undefined>
    ) {
      node.className = classnames(...newClasses);
    },
  };
}

const STYLE_DIMESION_CHAR = "%";
export const styleCommand = (...definitions: CxDefPlus): [CxDef, string] => {
  const styles: string[] = [];
  const cxDef: CxDef = [];

  definitions.forEach((classOrStyleDef) => {
    if (typeof classOrStyleDef === "string") {
      if (classOrStyleDef.startsWith(STYLE_DIMESION_CHAR)) {
        styles.push(classOrStyleDef.slice(1));
      } else {
        cxDef.push(classOrStyleDef as string);
      }
      // Arrays do not need to be preceded by @
    } else if (Array.isArray(classOrStyleDef)) {
      classOrStyleDef.forEach((styleDef) => {
        if (typeof styleDef === "string") {
          styles.push(styleDef);
        } else if (typeof styleDef === "object") {
          for (let key in styleDef) {
            if (styleDef[key]) {
              styles.push(key);
            }
          }
        }
      });
      return false;
    } else if (typeof classOrStyleDef === "object") {
      const newObj = Object.entries(classOrStyleDef as object).filter(
        ([classOrStyle, value]) => {
          if (classOrStyle.startsWith(STYLE_DIMESION_CHAR)) {
            if (value) {
              styles.push(classOrStyle.slice(1));
              return true;
            }
            return false;
          }
        }
      );
      cxDef.push(Object.fromEntries(newObj));
    }
  });

  const joinedStyles = styles
    .map((s) => (s.endsWith(";") ? s : s + ";"))
    .join("");

  return [cxDef, joinedStyles];
};

// Wrapper for classnames / cx
export function sc(node: HTMLElement, command: CxDefPlus | string) {
  if (typeof command === "string") command = [command];
  const [classes, cssText] = styleCommand(...command);
  node.className = classnames(...classes);
  node.style.cssText = cssText;

  return {
    update(
      newClasses: Array<string | { [key: string]: boolean } | null | undefined>
    ) {
      const [classes, cssText] = styleCommand(...command);
      node.className = classnames(...classes);
      node.style.cssText = cssText;
    },
  };
}
