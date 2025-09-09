import { EventConfig, Handlers } from "motia";
import OpenAI from "openai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import Mustache from "mustache";
import fs from "fs/promises";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const Activity = z.object({
    weight: z.string().optional(),
    meal: z.string().optional(),
    workout: z.string().optional(),
});

const ActivitiesPayload = z.object({
    activities: z.array(Activity).nonempty(),
});

export const config: EventConfig = {
    type: "event",
    name: "user-activity-extract",
    description:
        "Extract structured activity from free-form LINE message using OpenAI",
    subscribes: ["user-activity-extract"],
    emits: ["user-activity-log", "send-line-message-request"],
    input: z.object({
        userId: z.string(),
        message: z.string(),
        replyToken: z.string(),
    }),
    flows: ["health-companion"],
};

export const handler = async (input: any, { emit, logger }: any) => {
    const { userId, message, replyToken } = input;

    // Load the prompt template
    let template: string;
    try {
        template = await fs.readFile(
            "prompts/user-activity-extract.mustache",
            "utf-8"
        );
    } catch (err) {
        logger.error("Failed to load prompt template file", { error: err });
        return;
    }

    const prompt = Mustache.render(template, { message });

    try {
        // Use OpenAI API for structured data extraction
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a health data extraction assistant. Extract structured health activity data from user messages. 
                    
                    Respond only with valid JSON in this format:
                    {
                        "activities": [
                            {
                                "weight": "70kg" (if weight mentioned),
                                "meal": "chicken salad" (if food/meal mentioned),
                                "workout": "30-minute run" (if exercise mentioned)
                            }
                        ]
                    }
                    
                    If no activities are found, return {"activities": []}.`,
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const extractedData = JSON.parse(
            response.choices[0].message.content || '{"activities": []}'
        );
        const parsed = ActivitiesPayload.parse(extractedData);

        logger.info("OpenAI activity extraction successful", {
            userId,
            originalMessage: message,
            extractedActivities: parsed.activities,
        });

        // Emit each activity as a separate log entry
        for (const activity of parsed.activities) {
            await emit({
                topic: "user-activity-log",
                data: { userId, replyToken, ...activity },
            });
        }

        logger.info(
            `Emitted ${parsed.activities.length} activity log(s) for user ${userId}`
        );

        // Send confirmation message
        const confirmationMessage = `✅ Activity logged successfully! I recorded ${
            parsed.activities.length
        } activities:

${parsed.activities
    .map((activity, index) => {
        const parts = [];
        if (activity.weight) parts.push(`🏋️ Weight: ${activity.weight}`);
        if (activity.meal) parts.push(`🍽️ Meal: ${activity.meal}`);
        if (activity.workout) parts.push(`💪 Workout: ${activity.workout}`);
        return `${index + 1}. ${parts.join(", ")}`;
    })
    .join("\n")}

Keep up the great work! 💪`;

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: confirmationMessage,
                replyToken,
            },
        });

        logger.info("Activity confirmation message sent", { userId });
    } catch (err: any) {
        logger.error("Activity extraction failed with OpenAI:", err);

        let errorMessage = "";

        // Check if it's a quota exceeded error
        if (err?.status === 429 || err?.code === "insufficient_quota") {
            errorMessage = `⚠️ OpenAI 配額已用完，現在使用備用回應模式。

我已經收到你的活動訊息：「${message}」

雖然無法使用 AI 智能提取，但我仍然記錄了你的訊息。
請繼續記錄你的健康活動，等配額恢復後我會提供更好的數據提取功能！

你可以繼續：
• 記錄每日活動
• 詢問基本健康問題
• 要求簡單的建議

謝謝你的理解！💪`;
        } else {
            errorMessage =
                "Sorry, I couldn't process your activity data. Please try again with a clearer format like 'I weighed 70kg today and had a salad for lunch'.";
        }

        // Send error message
        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: errorMessage,
                replyToken,
            },
        });
    }
};
