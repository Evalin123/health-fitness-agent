import { EventConfig } from "motia";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const schema = z.object({
    userId: z.string(),
    message: z.string(),
    replyToken: z.string(),
});

export const config: EventConfig = {
    type: "event",
    name: "health-chat",
    description: "Handle general health conversations using OpenAI",
    subscribes: ["health-chat-message"],
    emits: ["send-line-message-request"],
    input: schema,
    flows: ["health-companion"],
};

export const handler = async (input: any, { emit, logger }: any) => {
    const { userId, message, replyToken } = input;

    logger.info("Health chat request received", { userId, message });

    try {
        // Use OpenAI API for intelligent health conversations
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a friendly, knowledgeable health and fitness assistant. Your role is to:

                    - Provide helpful, accurate health and fitness information
                    - Encourage users in their wellness journey
                    - Give practical, actionable advice
                    - Be supportive and motivational
                    - Use emojis to make conversations engaging
                    - Keep responses concise but informative
                    - Always encourage users to consult healthcare professionals for medical advice
                    
                    Available features you can mention:
                    • Activity logging: "I weighed 70kg and had a salad"
                    • Meal planning: "suggest a meal plan" 
                    • Workout planning: "I need a workout plan"
                    • Health analysis: "analyze my habits"
                    
                    Be conversational, helpful, and health-focused in your responses.`,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            temperature: 0.7,
            max_tokens: 400,
        });

        const aiResponse =
            response.choices[0].message.content ||
            "I'm here to help with your health journey! Feel free to ask me about nutrition, exercise, or wellness tips. 💪";

        logger.info("OpenAI health chat response generated", {
            userId,
            responseLength: aiResponse.length,
        });

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: aiResponse,
                replyToken,
            },
        });

        logger.info("Health chat response sent", { userId });
    } catch (error: any) {
        logger.error("Health chat failed with OpenAI", { userId, error });

        let fallbackResponse = "";

        // Check if it's a quota exceeded error
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            fallbackResponse = `⚠️ OpenAI 配額已用完，現在使用備用回應模式。

針對你的問題：「${message}」

以下是一些基本健康建議：

💤 **睡眠**：成人建議每晚 7-9 小時
💧 **水分**：每天 8-10 杯水 (約 2-2.5 公升)
🏃 **運動**：每週至少 150 分鐘中等強度運動
🍎 **飲食**：每天 5 份蔬果，均衡營養

我仍然可以幫你：
• 記錄活動數據
• 提供基本健康建議
• 回答常見健康問題

有其他問題請繼續問我！💪`;
        } else {
            fallbackResponse = `Hello! 👋 I'm your health assistant!

I can help you with:
🍎 Meal planning - ask "suggest a meal plan"
💪 Workout plans - say "I need a workout plan"  
📊 Activity logging - tell me "I ran 5km today"
📈 Health analysis - ask "analyze my habits"

What would you like to know about health and fitness? 💪`;
        }

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: fallbackResponse,
                replyToken,
            },
        });
    }
};
