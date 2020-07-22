import { generate as generateUuid } from "https://deno.land/std/uuid/v4.ts";
import {
  serve,
  ServerRequest,
  Server,
  HTTPOptions,
  serveTLS,
  HTTPSOptions,
} from "https://deno.land/std/http/server.ts";
import { ICreateCtx, ICtx, ICtxProviders } from "./ctx.ts";
import { defaultErrorHandler } from "./errors/defaultHandler.ts";
import { ErrorHandler, Handler } from "./handler.ts";
import { Methods } from "./methods.ts";
import { Router } from "./router.ts";

export interface IDeroutexOptions {
  /// The generator for ctx.requestId. Defaults to a UUIDv4.
  /// Can be set to `false` to disable (`ctx.requestId = undefined`)
  requestIdGenerator?: (() => string) | false;
  errorHandler?: ErrorHandler;
  providers?: ICtxProviders;
}

export interface IListenResponse {
  wait: Promise<void>;
  server: Server;
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
      query: Object.fromEntries(url.searchParams.entries()),
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
   * Starts the HTTP server
   */
  public listen(
    addr: string | HTTPOptions,
  ): IListenResponse {
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
   * Starts the server HTTP and wait
   */
  public async listenAndServe(
    addr: string | HTTPOptions,
  ) {
    await this.listen(addr).wait;
  }

  /**
   * Starts the HTTPS server
   */
  public listenSecure(
    options: HTTPSOptions,
  ): IListenResponse {
    const server = serveTLS(options);

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
   * Starts the HTTPS server and wait
   */
  public async listenAndServeSecure(
    options: HTTPSOptions,
  ) {
    await this.listenSecure(options).wait;
  }

  /**
   * Create a context object. Useful during testing
   */
  public static createCtx = ({
    path,
    query,
    req,
    res = {},
    requestId,
    providers,
    method,
    headers,
  }: ICreateCtx): ICtx => {
    res.headers = headers || new Headers();

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
      res,
      headers: res.headers,
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

  /**
   * Creates a mock ServerRequest, for testing.
   */
  public static mockReq(
    method: string,
    url: string,
    { headers = new Headers() } = {},
  ): ServerRequest {
    const req = new ServerRequest();
    req.method = method;
    req.url = url;
    req.headers = headers;

    return req;
  }
}
