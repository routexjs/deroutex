import { IBody } from "./body/body.ts";
import { Methods } from "./methods.ts";
import { ServerRequest, Response } from "https://deno.land/std/http/server.ts";

export interface ICtx {
  params: { [key: string]: string };
  readonly req: ServerRequest;
  readonly res: Response;
  readonly matches?: RegExpExecArray[];
  path: string;
  readonly method: Methods;
  readonly query: any;
  readonly requestId?: string;
  data: ICtxData;
  providers: ICtxProviders;
  body?: IBody;
  statusCode?: number;
  error?: Error;
  headers: Headers;
}

export interface ICtxData {
  [key: string]: any;
}

export interface ICtxProviders {
  [key: string]: any;
}

export interface ICreateCtx {
  path?: string;
  query?: any;
  requestId?: string;
  method?: string;
  providers?: ICtxProviders;
  req: ServerRequest;
  res?: Response;
  headers?: Headers;
}
