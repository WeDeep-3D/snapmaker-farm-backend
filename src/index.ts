import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import swagger from "@elysiajs/swagger";
import {env} from "@yolk-oss/elysia-env";
import {Elysia} from "elysia";

const app = new Elysia()
  .use(cors())
  .use(env({}))
  .use(staticPlugin())
  .use(swagger())
  .get("/", () => "Hello Elysia").listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
