// src/global.d.ts
declare module 'papaparse' {
    const Papa: any;
    export default Papa;
    export type ParseResult<T> = {
      data: T[];
      errors: any[];
      meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        fields?: string[];
      };
    };
  }