import { serve } from "@hono/node-server";
import { buildApp } from "./app";

const port = Number(process.env.PORT || 3000);
const app = buildApp();
serve({ fetch: app.fetch, port }, (info: { port: number }) => {
  console.log(`Conversa listening on http://localhost:${info.port}`);
});
