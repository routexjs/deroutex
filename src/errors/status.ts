export class ErrorWithStatusCode extends Error {
  public statusCode: number;

  public constructor(statusCode: number, message?: string) {
    super(message);
    this.statusCode = statusCode;

    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ErrorWithStatusCode.prototype);
  }
}
