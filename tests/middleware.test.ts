import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { Deroutex, ICtx, JsonBody, TextBody } from "../mod.ts";

Deno.test("It handles middleware", async () => {
  const app = new Deroutex();

  app
    .middleware((ctx) => {
      ctx.data.text = "Body!";

      return () => {
        ctx.body = new TextBody("Body: " + ctx.body?.toString());
      };
    })
    .get("/", (ctx) => {
      return new TextBody(ctx.data.text);
    });

  await superdeno(app.handler).get("/").expect("Body: Body!").expect(200);
});

Deno.test("It handles multiple middlewares", async () => {
  const app = new Deroutex();

  app
    .middleware([
      (ctx) => {
        ctx.data.text = "Hello";
      },
      (ctx) => {
        ctx.data.text = ctx.data.text + " world!";
      },
    ])
    .get("/", (ctx) => {
      return new TextBody(ctx.data.text);
    });

  await superdeno(app.handler).get("/").expect("Hello world!").expect(200);
});

Deno.test("It handles missing middleware", async () => {
  const app = new Deroutex();

  app
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    .middleware()
    .get("/", () => {
      return new TextBody("A");
    });

  await superdeno(app.handler).get("/").expect("A").expect(200);
});
