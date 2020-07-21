import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import {
  Deroutex,
  ErrorWithBody,
  ErrorWithStatusCode,
  ICtx,
  Router,
  TextBody,
} from "../mod.ts";

Deno.test("It handles 404", async () => {
  const app = new Deroutex();

  await superdeno(app.handler)
    .get("/")
    .expect(404);
});

Deno.test("It handles sub-routers error propagation", async () => {
  const app = new Deroutex();

  // Uses app/default error handler
  app.child("/1");

  const child2 = new Router();
  child2.errorHandler = () => undefined;
  app.child("/2", child2);

  const handler = superdeno(app.handler);

  await Promise.all([
    handler.get("/1").expect(404),
    handler.get("/2").expect(200),
  ]);
});

Deno.test("It handles error", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    throw new Error("Error");
  });

  await superdeno(app.handler).get("/").expect("Error").expect(500);
});

Deno.test("It handles error with status", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    throw new ErrorWithStatusCode(400, "Error");
  });

  await superdeno(app.handler).get("/").expect("Error").expect(400);
});

Deno.test("It handles error with body", async () => {
  const app = new Deroutex();

  app.get("/", () => {
    throw new ErrorWithBody(401, new TextBody("Error!"));
  });

  await superdeno(app.handler).get("/").expect("Error!").expect(401);
});

Deno.test("It handles customer handler", async () => {
  const app = new Deroutex({
    errorHandler: (ctx: ICtx) => (ctx.body = new TextBody("Error!")),
  });

  app.get("/", () => {
    throw new Error();
  });

  await superdeno(app.handler).get("/").expect("Error!");
});
