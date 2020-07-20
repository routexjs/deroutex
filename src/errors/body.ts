import { IBody } from "../body/body.ts";
import { ErrorWithStatusCode } from "./status.ts";

export class ErrorWithBody extends ErrorWithStatusCode {
  public body?: IBody;
  public constructor(statusCode: number, body?: IBody) {
    super(statusCode, body ? body.toString() : undefined);
    this.body = body;

    Object.setPrototypeOf(this, ErrorWithBody.prototype);
  }
}
