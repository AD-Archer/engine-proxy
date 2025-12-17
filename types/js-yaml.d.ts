declare module 'js-yaml' {
  export function load<T = unknown>(input: string): T;
  export function dump(input: unknown, options?: unknown): string;
  const _default: { load: typeof load; dump: typeof dump };
  export default _default;
}
