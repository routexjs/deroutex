import * as request from "supertest";
import { Deroutex, TextBody } from "../mod.ts";

describe("Query string", () => {
  it("Handles query string", () => {
    const app = new Deroutex();

    app.get("/test", (ctx) => {
      ctx.body = new TextBody(ctx.query.name);
    });

    return request(app.handler)
      .get("/test?name=john")
      .expect("john")
      .expect(200);
  });
});
