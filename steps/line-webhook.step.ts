import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";

export const config: ApiRouteConfig = {
    type: "api",
    name: "line-inbound-handler",
    description: "Handles incoming LINE messages via webhook",
    path: "/webhook",
    method: "POST",
    emits: ["message-received"],
    bodySchema: z.object({
        destination: z.string(),
        events: z.array(
            z.object({
                type: z.literal("message"),
                mode: z.string().optional(),
                timestamp: z.number(),
                source: z.object({
                    type: z.enum(["user", "group", "room"]),
                    userId: z.string().optional(),
                    groupId: z.string().optional(),
                    roomId: z.string().optional(),
                }),
                message: z.discriminatedUnion("type", [
                    z.object({
                        type: z.literal("text"),
                        id: z.string(),
                        text: z.string(),
                    }),
                    z.object({
                        type: z.literal("image"),
                        id: z.string(),
                        contentProvider: z.object({
                            type: z.string(),
                        }),
                    }),
                ]),
                replyToken: z.string(),
            })
        ),
    }),
    flows: ["health-companion"],
};

export const handler = async (
    req: any,
    { emit, logger }: { emit: any; logger: any }
) => {
    const body = req.body;
    let messageEvents: any[] = [];

    try {
        messageEvents =
            body.events?.filter((event: any) => event.type === "message") ?? [];
    } catch (e) {
        logger.error("Failed to extract LINE messages from webhook body", {
            body,
            error: e,
        });
    }

    if (!messageEvents.length) {
        logger.info(
            "No LINE messages in incoming webhook payload (non-message event)",
            { body }
        );
        return {
            status: 200,
            body: { message: "No user message to process" },
        };
    }

    // Process each message event
    for (const event of messageEvents) {
        try {
            const messageData: any = {
                userId: event.source.userId,
                sourceType: event.source.type,
                messageType: event.message.type,
                replyToken: event.replyToken,
                timestamp: event.timestamp,
            };

            // Handle different message types
            if (event.message.type === "text") {
                messageData.text = event.message.text;
            } else if (event.message.type === "image") {
                messageData.imageId = event.message.id;
            }

            // Emit message-received event
            await emit({
                topic: "message-received",
                data: messageData,
            });

            logger.info("LINE message processed", {
                userId: event.source.userId,
                messageType: event.message.type,
                hasText: !!messageData.text,
                hasImage: !!messageData.imageId,
            });
        } catch (e) {
            logger.error("Failed to process LINE message event", {
                event,
                error: e,
            });
        }
    }

    return {
        status: 200,
        body: { message: "Messages processed successfully" },
    };
};
