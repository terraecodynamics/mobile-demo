import { ScrollSmoother } from "gsap/ScrollSmoother";

const STORE = "kronis-scroll:";
const POP = "kronis-pop:";

function smoother() {
  try {
    if (ScrollSmoother && typeof ScrollSmoother.get === "function") {
      return ScrollSmoother.get();
    }
  } catch {
    /* plugin unavailable */
  }
  return null;
}

export function readScrollY() {
  const instance = smoother();
  if (instance && typeof instance.scrollTop === "function") {
    return Number(instance.scrollTop()) || 0;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function writeScrollY(y: number) {
  const top = Math.max(0, Number(y) || 0);
  const instance = smoother();
  if (instance && typeof instance.scrollTo === "function") {
    instance.scrollTo(top, false);
  }
  window.scrollTo({ top, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

export function saveScroll(pathname: string, y = readScrollY()) {
  try {
    sessionStorage.setItem(STORE + pathname, String(y));
  } catch {
    /* private mode */
  }
}

export function loadScroll(pathname: string) {
  try {
    return Number(sessionStorage.getItem(STORE + pathname) || 0);
  } catch {
    return 0;
  }
}

export function markPopRestore(pathname: string) {
  try {
    sessionStorage.setItem(POP + pathname, "1");
  } catch {
    /* private mode */
  }
}

export function consumePopRestore(pathname: string) {
  try {
    const flagged = sessionStorage.getItem(POP + pathname) === "1";
    if (flagged) sessionStorage.removeItem(POP + pathname);
    return flagged;
  } catch {
    return false;
  }
}

export function applySavedScroll(pathname: string) {
  writeScrollY(loadScroll(pathname));
}
