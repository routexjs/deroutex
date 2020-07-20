import { ICtx } from "./ctx.ts";
import { IBody } from "./body/body.ts";
import { ErrorWithStatusCode } from "./errors/status.ts";
import { Router } from "./router.ts";

type PromiseOr<T> = Promise<T> | T;

export type Handler = (ctx: ICtx) => PromiseOr<void | IBody>;

export type MiddlewareNext = () => PromiseOr<void | any>;

export type Middleware = (ctx: ICtx) => PromiseOr<void | MiddlewareNext | any>;

export type ErrorHandler =
  | Handler
  | ((ctx: ICtx, error: Error | ErrorWithStatusCode) => PromiseOr<void>);

type RouteHandler_ = Router | Handler;

export type RouteHandler = RouteHandler_ | RouteHandler_[];
