import * as request from "supertest";
import { Deroutex, TextBody } from "../mod.ts";

describe("OPTIONS", () => {
  it("Handles OPTIONS", () => {
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

    return request(app.handler)
      .options("/")
      .expect("Allow", "GET, POST")
      .expect(200);
  });
});
