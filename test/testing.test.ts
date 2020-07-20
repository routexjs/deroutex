import * as http from "http";
import { ICtx, ICtxRequest, Deroutex, TextBody } from "../mod.ts";

describe("Testing", () => {
  test("createCtx & runHandler", async () => {
    const body = new TextBody("Hello world!");

    const handler = (ctx: ICtx) => body;

    const ctx = Deroutex.createCtx({
      req: {} as ICtxRequest,
      res: {} as http.ServerResponse,
    });

    await Deroutex.runHandler(handler, ctx);

    expect(ctx.body).toBe(body);
  });

  test("createCtx & runHandler with error", async () => {
    const handler = () => {
      throw new Error("Test");
    };

    const ctx = Deroutex.createCtx({
      req: {} as ICtxRequest,
      res: {} as http.ServerResponse,
    });

    await Deroutex.runHandler(handler, ctx);

    expect(ctx.error).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ctx.error!.message).toBe("Test");
  });
});
