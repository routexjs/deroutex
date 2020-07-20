import { generate as generateUuid } from "https://deno.land/std/uuid/v4.ts";
import {
  serve,
  ServerRequest,
  HTTPOptions,
  Server,
} from "https://deno.land/std/http/server.ts";
import { ICreateCtx, ICtx, ICtxProviders } from "./ctx.ts";
import { defaultErrorHandler } from "./errors/defaultHandler.ts";
import { ErrorHandler, Handler } from "./handler.ts";
import { Methods } from "./methods.ts";
import { Router } from "./router.ts";
import { toArray } from "./utils.ts";

export interface IDeroutexOptions {
  /// The generator for ctx.requestId. Defaults to a UUIDv4.
  /// Can be set to `false` to disable (`ctx.requestId = undefined`)
  requestIdGenerator?: (() => string) | false;
  errorHandler?: ErrorHandler;
  providers?: ICtxProviders;
}

export class Deroutex extends Router {
  public requestIdGenerator?: () => string;
  public errorHandler = defaultErrorHandler;
  public providers: ICtxProviders;

  public constructor({
    requestIdGenerator,
    errorHandler,
    providers,
  }: IDeroutexOptions = {}) {
    super();
    if (requestIdGenerator !== false) {
      this.requestIdGenerator = requestIdGenerator || generateUuid;
    }

    if (errorHandler) {
      this.errorHandler = errorHandler;
    }

    this.providers = providers || {};
  }

  /**
   * Handles HTTP request
   */
  public handler = async (
    req: ServerRequest,
  ) => {
    // Parse query string and extract path
    // Uses `http://localhost` to make it a valid URL to parse
    const url = new URL("http://localhost" + req.url);

    const ctx = Deroutex.createCtx({
      path: url.pathname || "/",
      query: url.searchParams,
      method: req.method,
      requestId: this.requestIdGenerator
        ? this.requestIdGenerator()
        : undefined,
      providers: this.providers,
      req,
    });

    await this.handle(ctx);

    const chunk = ctx.body ? ctx.body.toBuffer() : undefined;

    if (ctx.body) {
      if (ctx.body.contentType && !ctx.headers.has("Content-Type")) {
        ctx.headers.set("Content-Type", ctx.body.contentType);
      }

      if (
        chunk && (!ctx.statusCode || ![204, 304].includes(ctx.statusCode)) &&
        !ctx.headers.has("Content-Length")
      ) {
        ctx.headers.set("Content-Length", chunk.length.toString());
      }
    }

    if (ctx.statusCode && !ctx.res.status) {
      ctx.res.status = ctx.statusCode;
    }

    if (chunk && ctx.body && ctx.method !== Methods.HEAD && !ctx.res.body) {
      ctx.res.body = ctx.body.toBuffer();
    }

    ctx.req.respond(ctx.res);

    return ctx;
  };

  /**
   * Starts the server
   */
  public listen(
    addr: string | HTTPOptions,
  ) {
    const server = serve(addr);

    const wait = (async () => {
      for await (const req of server) {
        this.handler(req);
      }
    })();

    return {
      wait,
      server,
    };
  }

  /**
   * Create a context object. Useful during testing
   */
  public static createCtx = ({
    path,
    query,
    req,
    res,
    requestId,
    providers,
    method,
    headers,
  }: ICreateCtx): ICtx => {
    /* istanbul ignore next */
    return {
      data: {},
      params: {},
      // Default to GET for missing methods (should never happen)
      method: (method || Methods.GET).toLowerCase() as Methods,
      path: path || "/",
      query: query || {},
      req,
      requestId,
      providers: { ...providers },
      res: res || {},
      headers: headers || new Headers(),
    };
  };

  /**
   * Run a handler, with associated "magic" logic
   */
  public static async runHandler(handler: Handler, ctx: ICtx) {
    try {
      const body = await handler(ctx);

      if (body) {
        ctx.body = body;
      }
    } catch (error) {
      ctx.error = error;
    }

    return ctx;
  }
}
