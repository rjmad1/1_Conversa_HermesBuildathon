import { z } from "zod";

export const NodeServerSchema = z.object({ port: z.number().default(3000) });
