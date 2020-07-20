import { pathToRegexp, Key } from "https://deno.land/x/path_to_regexp/mod.ts";
import { Methods } from "./methods.ts";

import { ICtx } from "./ctx.ts";
import { Handler, RouteHandler } from "./handler.ts";
import { Router } from "./router.ts";

export interface IRouteOptions {
  exact?: boolean;
}

export class Route {
  public method: Methods | Methods[] | undefined;
  public path: string | undefined;
  public regex: RegExp | undefined;
  public handler: RouteHandler;
  public keys: Key[] = [];

  public constructor(
    method: Methods | Methods[] | undefined,
    path: string | undefined,
    handler: RouteHandler,
    { exact = false }: IRouteOptions = {},
  ) {
    this.method = method;
    this.path = path;
    if (path) {
      this.regex = pathToRegexp(path, this.keys, { end: exact });
    }

    this.handler = handler;
  }

  public handle: Handler = async (ctx): Promise<any> => {
    return this.handleHandler(this.handler, ctx);
  };

  private handleHandler = async (
    handler: RouteHandler,
    ctx: ICtx,
  ): Promise<any> => {
    if (handler instanceof Router) {
      return handler.handle(ctx);
    } else if (Array.isArray(handler)) {
      for (let index = 0; index < handler.length; index++) {
        const childHandler = handler[index];
        const returned: any = await this.handleHandler(childHandler, ctx);

        if (index === handler.length - 1) {
          return returned;
        }
      }
    } else {
      return handler(ctx);
    }
  };
}
