export type InputEvent =
  | "tab-next"
  | "tab-prev"
  | "select"
  | "back"
  | "scroll-up"
  | "scroll-down";

type Handler = (e: InputEvent) => void;

const handlers = new Set<Handler>();

export function emit(e: InputEvent): void {
  handlers.forEach((h) => h(e));
}

export function subscribe(h: Handler): () => void {
  handlers.add(h);
  return () => {
    handlers.delete(h);
  };
}
