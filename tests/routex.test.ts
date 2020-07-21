import { Deroutex, JsonBody, Methods, TextBody } from "../mod.ts";
import { superdeno } from "https://deno.land/x/superdeno@main/mod.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";

Deno.test("It handles GET/POST/DELETE/PATCH/PUT index request", async () => {
  const app = new Deroutex();

  app
    .get("/", (ctx) => {
      ctx.body = new JsonBody({ name: "bonnie" });
    })
    .post("/", (ctx) => {
      ctx.body = new JsonBody({ name: "john" });
    })
    .delete("/", (ctx) => {
      ctx.body = new JsonBody({ name: "johnny" });
    })
    .patch("/", (ctx) => {
      ctx.body = new JsonBody({ name: "hayley" });
    })
    .put("/", (ctx) => {
      ctx.body = new JsonBody({ name: "charles" });
    })
    .route(Methods.GET, "/sub", (ctx) => {
      ctx.body = new JsonBody({ name: "joey" });
    })
    .route([Methods.POST], "/sub", (ctx) => {
      ctx.body = new JsonBody({ name: "matthew" });
    })
    .any("/any", (ctx) => {
      ctx.body = new JsonBody({ name: "tim" });
    });

  // Don't share `superdeno(app.handler)`, has bug if too many requests at once
  await Promise.all([
    superdeno(app.handler)
      .get("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "17")
      .expect(200),
    superdeno(app.handler)
      .post("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "15")
      .expect(200),
    superdeno(app.handler)
      .delete("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "17")
      .expect(200),
    superdeno(app.handler)
      .patch("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "17")
      .expect(200),
    superdeno(app.handler)
      .put("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "18")
      .expect(200),
    superdeno(app.handler)
      .get("/sub")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "15")
      .expect(200),
    superdeno(app.handler)
      .post("/sub")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "18")
      .expect(200),
    superdeno(app.handler)
      .get("/any")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "14")
      .expect(200),
  ]);
});

Deno.test("It handles 404", async () => {
  const app = new Deroutex();

  await superdeno(app.handler).post("/").expect(404);
});

Deno.test("It handles array handlers", async () => {
  const app = new Deroutex();

  app.get("/", [
    (ctx) => {
      // @ts-ignore
      ctx.data.name = "john";
    },
    (ctx) => {
      // @ts-ignore
      ctx.body = new JsonBody({ name: ctx.data.name });
    },
  ]);

  await superdeno(app.handler)
    .get("/")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "15")
    .expect(200);
});

Deno.test("It handles multiple routes", async () => {
  const app = new Deroutex();

  app
    .get("/women", (ctx) => {
      ctx.body = new JsonBody({ name: "bonnie" });
    })
    .get("/man", (ctx) => {
      ctx.body = new JsonBody({ name: "john" });
    })
    .get("/", (ctx) => {
      ctx.statusCode = 404;
      ctx.body = new JsonBody({ name: null });
    });

  const appRequest = superdeno(app.handler);

  await Promise.all([
    appRequest
      .get("/man")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "15")
      .expect(200),
    appRequest
      .get("/women")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "17")
      .expect(200),
    appRequest
      .get("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "13")
      .expect(404),
  ]);
});

Deno.test("It handles sub-routers", async () => {
  const app = new Deroutex();

  app.child("/child").get("/", (ctx) => {
    ctx.body = new JsonBody({ name: "joey" });
  });

  app.get("/", (ctx) => {
    ctx.statusCode = 404;
    ctx.body = new JsonBody({ name: null });
  });

  const handler = superdeno(app.handler);

  await Promise.all([
    handler
      .get("/child")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "15")
      .expect(200),
    handler
      .get("/")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "13")
      .expect(404),
  ]);
});

Deno.test("it handles full sub-routers", async () => {
  const app = new Deroutex();

  app
    .child("/")
    .child("/test")
    .get("/child", (ctx) => {
      ctx.body = new JsonBody({ name: "joey" });
    });

  await superdeno(app.handler)
    .get("/test/child")
    .expect("Content-Type", /json/)
    .expect("Content-Length", "15")
    .expect(200);
});

Deno.test("it handles sub-routers with matching paths", async () => {
  const app = new Deroutex();

  app.child("/test/test").get("/b", (ctx) => {
    ctx.body = new TextBody("B");
  });

  app.child("/test").get("/a", (ctx) => {
    ctx.body = new TextBody("A");
  });

  const handler = superdeno(app.handler);

  await Promise.all([
    handler.get("/test/a").expect(200).expect("A"),
    handler.get("/test/test/b").expect(200).expect("B"),
  ]);
});

Deno.test("it handles params", async () => {
  const app = new Deroutex();

  app
    .get("/letter/:letter?", (ctx) => {
      ctx.body = new TextBody(ctx.params.letter || "");
    })
    .get("/:name", (ctx) => {
      ctx.body = new JsonBody({ name: ctx.params.name });
    });

  const handler = superdeno(app.handler);

  await Promise.all([
    handler
      .get("/john")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "15")
      .expect(200),
    handler
      .get("/john%20smith")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "21")
      .expect(200),
    handler.get("/letter/a").expect("a").expect(200),
    handler.get("/letter").expect("").expect(200),
    handler.get("/letter/%^").expect(500),
  ]);
});

Deno.test("Has request ID", async () => {
  const appUuid = new Deroutex();
  appUuid.get("/", (ctx) => {
    ctx.body = new TextBody(ctx.requestId!);
  });

  const appFixed = new Deroutex({ requestIdGenerator: () => "FIXED" });
  appFixed.get("/", (ctx) => {
    ctx.body = new TextBody(ctx.requestId!);
  });

  const appNone = new Deroutex({ requestIdGenerator: false });
  appNone.get("/", (ctx) => {
    ctx.body = new TextBody(ctx.requestId === undefined ? "YES" : "NO");
  });

  await Promise.all([
    superdeno(appUuid.handler)
      .get("/")
      .expect(({ text }) => assert(text.length === 36)),
    superdeno(appFixed.handler).get("/").expect("FIXED"),
    superdeno(appNone.handler).get("/").expect("YES"),
  ]);
});
