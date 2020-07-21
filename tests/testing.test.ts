import { ICtx, Deroutex, TextBody } from "../mod.ts";
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("createCtx & runHandler", async () => {
  const handler = (ctx: ICtx) =>
    new TextBody(`${ctx.method} ${ctx.req.headers.get("X-Test")}`);

  const headers = new Headers();
  headers.set("X-Test", "Deroutex");

  const ctx = Deroutex.createCtx({
    req: Deroutex.mockReq("GET", "/", { headers }),
  });

  await Deroutex.runHandler(handler, ctx);

  assertEquals(ctx.body?.toString(), "get Deroutex");
});

Deno.test("createCtx & runHandler with error", async () => {
  const handler = () => {
    throw new Error("Test");
  };

  const ctx = Deroutex.createCtx({
    req: Deroutex.mockReq("GET", "/"),
  });

  await Deroutex.runHandler(handler, ctx);

  assert(ctx.error);
  assertEquals(ctx.error!.message, "Test");
});
