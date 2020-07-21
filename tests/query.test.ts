import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { Deroutex, TextBody } from "../mod.ts";

Deno.test("It handles query string", async () => {
  const app = new Deroutex();

  app.get("/test", (ctx) => {
    ctx.body = new TextBody(ctx.query.name);
  });

  await superdeno(app.handler)
    .get("/test?name=john")
    .expect("john")
    .expect(200);
});
