import { handle } from "hono/vercel";
import { buildApp } from "../src/app/index.js";

const app = buildApp();

export default handle(app);
