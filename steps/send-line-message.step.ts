import { EventConfig, Handlers } from "motia";
import { z } from "zod";
import axios from "axios";

const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

const schema = z.object({
    userId: z.string(),
    message: z.string(),
    replyToken: z.string(),
});

export const config: EventConfig = {
    type: "event",
    name: "send-line-message",
    description: "Send a LINE message via Reply API (event-driven)",
    subscribes: ["send-line-message-request"],
    emits: [],
    input: schema,
    flows: ["health-companion"],
};

export const handler = async (input: any, { logger }: any) => {
    const { userId, replyToken } = input;
    let { message } = input;

    // Error handling: Empty messages
    if (!message || typeof message !== "string") {
        logger.warn("Invalid or empty message received.", {
            userId,
            replyToken,
        });
        return;
    }

    // Error handling: Missing replyToken (LINE-specific requirement)
    if (!replyToken) {
        logger.warn("No reply token provided for LINE message.", { userId });
        return;
    }

    // Error handling: Missing userId
    if (!userId) {
        logger.warn("No userId provided for LINE message.", { replyToken });
        return;
    }

    // Error handling: Message too long (LINE has 5000 character limit)
    if (message.length > 5000) {
        logger.warn("Message too long for LINE API, truncating.", {
            userId,
            originalLength: message.length,
        });
        message = message.substring(0, 4990) + "...";
    }

    // Error handling: Missing LINE Channel Access Token
    if (!lineChannelAccessToken) {
        logger.error("LINE_CHANNEL_ACCESS_TOKEN not configured.", {
            userId,
            replyToken,
        });
        return;
    }

    // LINE Reply API payload
    const payload = {
        replyToken: replyToken,
        messages: [
            {
                type: "text",
                text: message,
            },
        ],
    };

    const headers = {
        Authorization: `Bearer ${lineChannelAccessToken}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            payload,
            { headers }
        );

        logger.info(`LINE message sent to user ${userId}: ${response.status}`, {
            userId,
            replyToken,
            messageLength: message.length,
        });
    } catch (error: any) {
        const errRes = error.response?.data || error.message;
        const status = error.response?.status;

        // Enhanced error handling with specific LINE API error cases
        if (status === 400) {
            logger.error("LINE API: Bad Request - Invalid payload format", {
                error: errRes,
                userId,
                replyToken,
                messageLength: message.length,
            });
        } else if (status === 401) {
            logger.error(
                "LINE API: Authentication failed - Invalid Channel Access Token",
                {
                    error: errRes,
                    userId,
                    replyToken,
                }
            );
        } else if (status === 403) {
            logger.error("LINE API: Forbidden - Insufficient permissions", {
                error: errRes,
                userId,
                replyToken,
            });
        } else if (status === 429) {
            logger.error("LINE API: Rate limit exceeded", {
                error: errRes,
                userId,
                replyToken,
            });
        } else {
            logger.error("LINE Send Error:", {
                error: errRes,
                status,
                userId,
                replyToken,
                messageLength: message.length,
            });
        }
    }
};
