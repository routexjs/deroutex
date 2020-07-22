# Deroutex: Modern Deno Router

A Deno port of [Routex](https://routex.js.org).

This is not ready for production yet!

What is missing:

- Documentation is WIP (currently Routex's docs can be used, main changes are to the `listen` APIs)
- First-party packages for cookies, WebSockets (body parsing is done)
- Finding a home to release it
- Benchmarking and extensive testing

Feel free to test and give feedback 😃

### Features

- Modern API, with native Promise support, fully typed (TypeScript)
- Very few dependencies, small API surface, easy to fully understand and extend
- Extensible middleware API
- Path parameters and query parameters
- Multiple types of response body (and easy creation of new response body types)

## [Example](./example.ts)

```ts
import { Deroutex, TextBody, JsonBody, ErrorWithBody } from "./mod.ts";

// Initial the Deroutex application
const app = new Deroutex();

// Basic GET router
app.get("/", () => {
  // Response bodies are returned
  return new TextBody("Hello Deroutex!");
});

// Path params
app.get("/greet/:name", (ctx) => {
  // Alternative to returning a body
  ctx.body = new JsonBody({ hello: ctx.params.name });
});

// This POST will trigger the default error handler (can be overriden)
app.post("/error", () => {
  throw new Error("Flow control with errors!");
});

// Create a child router
const privateRouter = app.child("/private");

// Add a middleware to our router. `app` is a router too!
privateRouter.middleware(async (ctx) => {
  // Pre-handler middleware
  if (!ctx.req.headers.has("Authorization")) {
    throw new ErrorWithBody(401, new JsonBody({ error: "UNAUTHORIZED" }));
  }

  return () => {
    // Post-handler middleware: This example wraps the handle's body ({"body": "You are authorized!"})
    ctx.body = new JsonBody({
      body: ctx.body?.toString(),
    });
  };
});

// Catch-all path
privateRouter.any("/", () => {
  return new TextBody("You are authorized!");
}, { exact: false });

// Start the server!
await app.listenAndServe(":5000");
```

## Usage

### `Deroutex`

The `Deroutex` object is your main application. It holds all child routers and can start your server
using one of the follow methods:

- `listen` / `listenAndServe`: Start the HTTP server
- `listenSecure` / `listenAndServeSecure`: Start the HTTPS server

### Routers

`Deroutex` is a router itself. You can also create child routers in 2 ways:

- Using `app.child(path)`. Example:
  ```ts
  const childRouter = app.child("/accounts")
  ```
- Using `Router`. Example:
  ```ts
  const childRouter = new Router();
  
  // Attach the router
  app.child("/accounts", childRouter)
  ```
  
### Routes

On a router, you can attach paths using `.get`, `.post`, `.delete`, `.put`, `.patch`, `.options`, or `.head`.
You can also use `.any` to match all HTTP methods, or use `.route` to manually add a route.

Example:

```ts
app.get("/", () => new TextBody("Home page"))
app.post("/", () => new TextBody("POSTed on home page"))
app.any("/", () => new TextBody("Any other method on home page"))

app.route("put", "/put", () => new TextBody("PUT on /put"))
app.route(["delete", "head"], "/delete", () => new TextBody("DELETE or HEAD on /delete"))
```

### Middlewares

You can add middlewares on any router using the `.middleware` method:

```ts
app.middleware((ctx) => {
  console.log("Ran before all handlers");
});

childRouter.middleware((ctx) => {
  console.log("Ran before child router handlers");

  return () => {
    console.log("Ran after child router handlers");
  };
});
```

You can also apply middlewares per route:

```ts
function myMiddleware(ctx: ICtx) {}
function myHandler(ctx: ICtx) {}

app.get("/", [myMiddleware, myHandler])
```

### Bodies

To return data in the response, Deroutex uses the concept of 'bodies'. Here are some examples:

```ts
app.get("/", () => {
  return new JsonBody({ text: "This returns some JSON" });
});

app.get("/", (ctx) => {
  // Alternative to `return`
  ctx.body = new TextBody("This returns some text");
});

app.get("/", (ctx) => {
  // Change the response Content-Type for TextBody
  return new TextBody("<strong>Hello!</strong>", "text/html");
});
```

You can easily create your own return body types by implementing the `IBody` interface.

### Errors

Deroutex uses errors for flow control. This greatly simplifies how errors are returned to the client:

```ts
app.get("/", () => {
  throw new Error("Some error!")
});

app.get("/", () => {
  throw new ErrorWithStatusCode(500, "Some error!")
});

app.get("/", () => {
  throw new ErrorWithBody(500, new TextBody("Some error!"))
});
```

All errors go the `Deroutex` error handler, which can be overridden by passing `errorHandler` in the constructor:

```ts
function errorHandler(ctx: ICtx, error: Error) {
  // Can't use return in error handler
  ctx.body = new TextBody("Whoops! Got an error: " + error)
}

const app = new Deroutex({ errorHandler });
```

### Context object

The `ctx` object is a core concept of Deroutex. It contains the whole incoming request.

These are some of the most useful properties on `ICtx`:

- `req`: The `ServerRequest` from Deno
- `method`: The request method (lower-case)
- `query`: Query parameters of the request
- `params`: Matched path parameters of the request (using `:` in path)
- `data`: Flexible object to hold request data, such as `ctx.data.user`
- `headers`: The response headers (use `ctx.req.headers` for incoming headers)
- `statusCode`: The response status code
- `body`: The response body
- `requestId`: The request ID. Defaults to a random UUID (can be overridden by passing a `requestIdGenerator` to `Deroutex`, or setting to `false` to disable)

## Extensions

Deroutex can easily be extended using middlewares. We provide a set of a quality and tested first-party
modules for the most common use cases:

- [Body parser](https://github.com/routexjs/deroutex_body_parser)

## Support

Since Deno is evolving quickly, only the latest version is officially supported.

Please file feature requests and bugs at the [issue tracker](https://github.com/routexjs/deroutex/issues).
