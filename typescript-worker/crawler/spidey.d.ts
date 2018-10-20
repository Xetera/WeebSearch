export declare type QuerySelector = string;

export interface SpiderOptions {
  targets: string[];
  selector: QuerySelector;
  limit?: number;
  callback: (info: SpiderCallback) => Promise<any>;
  paginate?: QuerySelector;
  respectRobotsTxt?: boolean;
  // userAgent: string;
}

// export interface SpiderResponse {
//   targets: string[];
//   targetPerPage: number;
// }

export interface SpiderCallback {
  cookie: string;
  selections: CheerioElement[];
  processFiles: boolean;
}
