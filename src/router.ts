import { ErrorWithStatusCode } from "./errors/status.ts";
import { ErrorHandler, MiddlewareNext, RouteHandler } from "./handler.ts";
import { Handler, Middleware, Deroutex } from "../mod.ts";
import { allMethods, Methods } from "./methods.ts";
import { IRouteOptions, Route } from "./route.ts";
import { decodeParam, toArray, toLowerCases } from "./utils.ts";

type RouteAdder = (
  path: string,
  handler: RouteHandler,
  options?: IRouteOptions,
) => Router;

type RouterWithMiddlewares = [Router | null, Middleware | Middleware[]];

export class Router {
  public errorHandler: ErrorHandler | undefined;

  // Methods, added dynamically
  public get!: RouteAdder;
  public post!: RouteAdder;
  public delete!: RouteAdder;
  public put!: RouteAdder;
  public patch!: RouteAdder;

  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  public child = (
    path: string,
    handler?: Router | RouterWithMiddlewares,
    options?: IRouteOptions,
  ) => {
    let router: Router | undefined | null;

    let routerMiddlewares: Middleware[] | undefined;
    if (handler instanceof Router) {
      router = handler;
    } else if (Array.isArray(handler)) {
      router = handler[0];
      routerMiddlewares = toArray(handler[1]);
    }

    if (!router) {
      router = new Router();
    }
    if (routerMiddlewares) {
      router.middleware(routerMiddlewares);
    }

    this.routes.push(new Route(undefined, path, router, options));

    return router;
  };

  public route = (
    method: Methods | Methods[] | undefined,
    path: string,
    handler: RouteHandler,
    options?: IRouteOptions,
  ) => {
    this.routes.push(
      new Route(
        toLowerCases(method) as Methods | Methods[] | undefined,
        path,
        handler,
        { exact: true, ...options },
      ),
    );
    return this;
  };

  public any = (
    path: string,
    handler: RouteHandler,
    options?: IRouteOptions,
  ) => {
    return this.route(undefined, path, handler, options);
  };

  public middleware = (middleware: Middleware | Middleware[]) => {
    if (middleware) {
      this.middlewares.push(...toArray(middleware));
    }

    return this;
  };

  public handle: Handler = async (ctx) => {
    try {
      if (!ctx.path || !ctx.path.startsWith("/")) {
        ctx.path = "/" + (ctx.path || "");
      }

      const url: string = ctx.path;

      let route: Route | undefined;
      let match: RegExpExecArray | undefined | null;
      const params: { [key: string]: string } = {};

      const optionsAllowedMethods: Methods[] = [];

      this.routes.some((testRoute) => {
        if (testRoute.regex) {
          match = testRoute.regex.exec(url);
          if (!match) {
            return false;
          } else {
            // Lots of ifs, but need to be explicit for TypeScript
            if (testRoute.method) {
              if (Array.isArray(testRoute.method)) {
                optionsAllowedMethods.push(...testRoute.method);
              } else {
                optionsAllowedMethods.push(testRoute.method);
              }
            } else {
              optionsAllowedMethods.push(...allMethods);
            }
          }
        }

        const noMatchingMethod = testRoute.method &&
          testRoute.method !== ctx.method &&
          !(
            Array.isArray(testRoute.method) &&
            testRoute.method.includes(ctx.method)
          );

        if (noMatchingMethod) {
          return false;
        }

        if (match) {
          ctx.path = ctx.path.replace(match[0], "");
        }

        route = testRoute;
        return true;
      });

      if (route && match) {
        const middlewaresNext: MiddlewareNext[] = [];

        async function applyNextMiddlewares() {
          for (const middelwareNext of middlewaresNext) {
            await middelwareNext();
          }
        }

        try {
          for (let index = 1; index < match.length; index++) {
            const key = route.keys[index - 1];
            const prop = key.name;
            const value = decodeParam(match[index]);
            if (value !== undefined && !(prop in params)) {
              params[prop] = value;
            }
          }

          ctx.params = { ...ctx.params, ...params };

          for (const middleware of this.middlewares) {
            const next = await middleware(ctx);

            if (next && typeof next === "function") {
              middlewaresNext.push(next);
            }
          }

          await Deroutex.runHandler(route.handle, ctx);

          if (ctx.error) {
            throw ctx.error;
          }
        } catch (error) {
          await applyNextMiddlewares();
          throw error;
        }

        await applyNextMiddlewares();

        return;
      }

      if (ctx.method === Methods.OPTIONS) {
        // Prevent duplicates methods, all upper-case
        const methods: string[] = [];
        optionsAllowedMethods.forEach((optionsMethod) => {
          if (methods.includes(optionsMethod.toUpperCase())) {
            return;
          }
          methods.push(optionsMethod.toUpperCase());
        });

        ctx.headers.set("Allow", methods.join(", "));
        return;
      }

      // 404
      throw new ErrorWithStatusCode(404, "Not Found");
    } catch (error) {
      if (this.errorHandler) {
        return this.errorHandler(ctx, error);
      }

      throw error;
    }
  };
}

// Attach method shortcuts such as router.get(...), etc
Object.values(Methods).forEach((method) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  Router.prototype[method] = function (
    path: string,
    handler: RouteHandler,
    options?: IRouteOptions,
  ) {
    return this.route(method, path, handler, options);
  };
});
