// The library's own declaration build runs plain tsc, without next-env.d.ts, so it needs to be told what a CSS
// import is. Next and Vite both supply this for the app and test builds; this file is only for `npm run build:lib`.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const css: string;
  export default css;
}
