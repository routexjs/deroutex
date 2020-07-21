import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { Deroutex, TextBody } from "../mod.ts";

Deno.test("It handles OPTIONS", async () => {
  const app = new Deroutex();
  app.get("/", (ctx) => {
    ctx.body = new TextBody("");
  });
  app.get("/", (ctx) => {
    ctx.body = new TextBody("");
  });
  app.post("/", (ctx) => {
    ctx.body = new TextBody("");
  });

  await superdeno(app.handler)
    .options("/")
    .expect("Allow", "GET, POST")
    .expect(200);
});
