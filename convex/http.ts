import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const { type, data } = event;

    switch (type) {
      case "user.created":
      case "user.updated": {
        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? "",
          name: [data.first_name, data.last_name].filter(Boolean).join(" ") || undefined,
          avatarUrl: data.image_url || undefined,
        });
        break;
      }
      case "user.deleted": {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: data.id,
        });
        break;
      }
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
