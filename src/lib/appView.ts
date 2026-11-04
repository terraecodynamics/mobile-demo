const KEY = "terraeco.demo.shell";

export type AppView = "phone" | "web";

export function readAppView(): AppView {
  if (typeof window === "undefined") return "phone";
  try {
    return window.localStorage.getItem(KEY) === "web" ? "web" : "phone";
  } catch {
    return "phone";
  }
}

export function setAppView(view: AppView) {
  try {
    window.localStorage.setItem(KEY, view);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent("terraeco-view", { detail: view }));
}
