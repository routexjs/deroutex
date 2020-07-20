import * as request from "supertest";
import { ICtx, Deroutex } from "../mod.ts";

describe("App Middlewares", () => {
  it("Calls app middlewares", async () => {
    let calledAppMiddleware = false;
    let calledInitializeServer = false;

    const appMiddleware = () => {
      calledAppMiddleware = true;
      return {
        initializeServer() {
          calledInitializeServer = true;
        },
      };
    };

    const app = new Deroutex();
    app.appMiddleware(appMiddleware);

    const { close } = await app.listen();

    expect(calledAppMiddleware).toBeTruthy();
    expect(calledInitializeServer).toBeTruthy();

    await close();
  });

  it("Handles missing app middleware", () => {
    const app = new Deroutex();
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    app.appMiddleware();

    app.get("/", (ctx: ICtx) => {
      ctx.res.write("A");
    });

    return request(app.handler).get("/").expect("A").expect(200);
  });
});
