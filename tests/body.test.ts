import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { Deroutex, JsonBody, TextBody } from "../mod.ts";

Deno.test("It handles JSON pretty print", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    return new JsonBody({ name: "john" }, { pretty: true });
  });

  await superdeno(app.handler)
    .get("/")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "20")
    .expect(200);
});

Deno.test("It handles custom JSON pretty print", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    return new JsonBody({ name: "john" }, { pretty: "\t" });
  });

  await superdeno(app.handler)
    .get("/")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "19")
    .expect(200);
});

Deno.test("It handles string body", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    return new TextBody("hello");
  });

  await superdeno(app.handler)
    .get("/")
    .expect("hello")
    .expect("Content-Length", "5")
    .expect(200);
});

Deno.test("It handles setting body", async () => {
  const app = new Deroutex();

  app.get("/", (ctx) => {
    ctx.body = new TextBody("hello");
  });

  await superdeno(app.handler)
    .get("/")
    .expect("hello")
    .expect("Content-Length", "5")
    .expect(200);
});
