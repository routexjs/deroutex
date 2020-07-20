import { ErrorWithBody } from "./body.ts";
import { ErrorWithStatusCode } from "./status.ts";
import { ErrorHandler } from "../handler.ts";
import { TextBody } from "../body/text.ts";

export const defaultErrorHandler: ErrorHandler = (ctx, error) => {
  ctx.statusCode = error instanceof ErrorWithStatusCode
    ? error.statusCode
    : 500;

  ctx.body = error instanceof ErrorWithBody
    ? error.body
    : new TextBody(error.message);
};
