import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare module 'connect-sqlite3' {
  import session from 'express-session';
  function init(s: typeof session): any;
  export default init;
}
