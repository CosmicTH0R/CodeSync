declare module 'prettier/standalone' {
  const prettier: any
  export default prettier
  export function format(code: string, options: any): string
}

declare module 'prettier/parser-babel' {
  const plugin: any
  export default plugin
}

declare module '@prettier/plugin-python' {
  const plugin: any
  export default plugin
}
