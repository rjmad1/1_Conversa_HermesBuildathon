import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  pathPrefix: "/api/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Basic route matching based on request.url
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/", ""); // e.g. mutations/meetings/save
    const body = await request.json();

    try {
      if (path === "mutations/meetings/save") {
        await ctx.runMutation(internal.meetings.save, { meeting: body.meeting });
        return new Response(JSON.stringify({ value: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (path === "queries/meetings/get") {
        const meeting = await ctx.runQuery(internal.meetings.get, { id: body.id });
        return new Response(JSON.stringify({ value: meeting }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      
      // Default fallback
      return new Response(JSON.stringify({ value: null, message: "Route not fully implemented yet in Convex HTTP router" }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }),
});

export default http;
