import { EventConfig, Handlers } from "motia";
import OpenAI from "openai";
import { z } from "zod";
import Mustache from "mustache";
import fs from "fs/promises";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const INTENTS = ["plan_meal", "plan_workout", "log_activity", "analyze_habits"];

export const config: EventConfig = {
    type: "event",
    name: "classify-user-intent",
    description: "Classify incoming LINE message using OpenAI",
    subscribes: ["message-received"],
    emits: [
        "planner-request",
        "user-activity-extract",
        "analyze-user-habits",
        "health-chat-message",
    ],
    input: z.object({
        userId: z.string(),
        sourceType: z.string(),
        messageType: z.string(),
        replyToken: z.string(),
        timestamp: z.number(),
        text: z.string().optional(),
        imageId: z.string().optional(),
    }),
    flows: ["health-companion"],
};

export const handler = async (input: any, { emit, logger }: any) => {
    const { userId, text, messageType, replyToken } = input;

    // Skip non-text messages for now
    if (messageType !== "text" || !text) {
        logger.info("Skipping non-text message for intent classification", {
            userId,
            messageType,
        });
        return;
    }

    // Load the prompt template
    let template: string;
    try {
        template = await fs.readFile(
            "prompts/classify-intent.mustache",
            "utf-8"
        );
    } catch (err) {
        logger.error("Failed to load prompt template file", { error: err });
        // Fallback to general chat if template fails
        await emit({
            topic: "health-chat-message",
            data: {
                userId,
                message: text,
                replyToken,
            },
        });
        return;
    }

    const prompt = Mustache.render(template, {
        intents: INTENTS,
        message: text,
    });

    try {
        // Use OpenAI API for intent classification
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a health assistant that classifies user messages into specific intents. Respond with only the exact intent name.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 50,
        });

        let intent =
            response.choices[0].message.content?.trim() || "health-chat";

        // Validate intent is in our allowed list
        if (!INTENTS.includes(intent)) {
            intent = "health-chat"; // fallback to health-chat for invalid intents
        }

        logger.info("Intent classified with OpenAI", { userId, text, intent });

        // Route to appropriate handler based on intent
        switch (intent) {
            case "plan_meal":
            case "plan_workout":
                await emit({
                    topic: "planner-request",
                    data: {
                        userId,
                        intent,
                        message: text,
                        replyToken,
                    },
                });
                break;

            case "log_activity":
                await emit({
                    topic: "user-activity-extract",
                    data: {
                        userId,
                        message: text,
                        replyToken,
                    },
                });
                break;

            case "analyze_habits":
                await emit({
                    topic: "analyze-user-habits",
                    data: {
                        userId,
                        replyToken,
                    },
                });
                break;

            default:
                // Default to general health chat
                await emit({
                    topic: "health-chat-message",
                    data: {
                        userId,
                        message: text,
                        replyToken,
                    },
                });
                break;
        }
    } catch (error: any) {
        logger.error("Failed to classify intent with OpenAI", {
            userId,
            text,
            error,
        });

        // Check if it's a quota exceeded error
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            await emit({
                topic: "health-chat-message",
                data: {
                    userId,
                    message:
                        "⚠️ OpenAI 配額已用完，現在使用備用回應模式。\n\n" +
                        "我仍然可以幫你處理基本的健康諮詢和活動記錄！",
                    replyToken,
                },
            });
            return;
        }

        // Fallback to general chat for other errors
        await emit({
            topic: "health-chat-message",
            data: {
                userId,
                message: text,
                replyToken,
            },
        });
    }
};
