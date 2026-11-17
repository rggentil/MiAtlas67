export type MessageParams = Readonly<Record<string, string | number>>;

/** Replaces each `{name}` of a UI text with its value; unknown placeholders stay as they are. */
export function formatMessage(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}
