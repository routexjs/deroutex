import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { JsonBody, Deroutex, TextBody } from "../mod.ts";
import { assertThrows } from "https://deno.land/std/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";

Deno.test("It handles listen on random port", async () => {
  const app = new Deroutex();

  app.get("/", (ctx) => {
    ctx.body = new JsonBody({ name: "john" });
  });

  const { server } = app.listen(":0");

  await superdeno(
    `http://localhost:${(server.listener.addr as Deno.NetAddr).port}`,
  )
    .get("/")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "15")
    .expect(200);

  server.close();
});

Deno.test("It handles listen on assigned port", async () => {
  const app = new Deroutex();

  app.get("/", (ctx) => {
    ctx.body = new JsonBody({ name: "john" });
  });

  const { server } = app.listen({ port: 9999 });

  await superdeno(`http://localhost:9999`)
    .get("/")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "15")
    .expect(200);

  server.close();
});

Deno.test("It doesn't listen on invalid hostname/port", async () => {
  const app = new Deroutex();

  app.get("/", (ctx) => {
    ctx.body = new JsonBody({ name: "john" });
  });

  assertThrows(() => app.listen("invalid port"));
});

// Current broken due to inability to use self-signed certificates.
// https://github.com/denoland/deno/issues/5931
//
// Deno.test("It handles HTTPS listen", async () => {
//   const app = new Deroutex();
//
//   app.get("/", (ctx) => {
//     ctx.body = new TextBody("john");
//   });
//
//   const dirname = path.dirname(path.fromFileUrl(import.meta.url));
//
//   const { server } = app.listenSecure({
//     port: 9998,
//     certFile: path.join(dirname, "cert.pem"),
//     keyFile: path.join(dirname, "key.pem"),
//   });
//
//   await superdeno(
//     `https://localhost:${(server.listener.addr as Deno.NetAddr).port}`,
//     true,
//   )
//     .get("/")
//     .expect("john");
//
//   await server.close();
// });
