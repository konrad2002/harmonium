declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.jpg' {
  const path: string;
  export default path;
}