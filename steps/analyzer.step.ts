import { EventConfig, Handlers } from "motia";
import OpenAI from "openai";
import { z } from "zod";
import Mustache from "mustache";
import fs from "fs/promises";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const config: EventConfig = {
    type: "event",
    name: "analyzer",
    description:
        "Analyze LINE user health activity and provide insights using OpenAI",
    subscribes: ["analyze-user-habits"],
    emits: ["send-line-message-request"],
    input: z.object({
        userId: z.string(),
        replyToken: z.string(),
    }),
    flows: ["health-companion"],
};

export const handler = async (input: any, { emit, logger }: any) => {
    const { userId, replyToken } = input;

    logger.info("Health analysis request received", { userId });

    try {
        // Load the prompt template
        let template: string;
        try {
            template = await fs.readFile(
                "prompts/analyze-health.mustache",
                "utf-8"
            );
        } catch (err) {
            logger.error("Failed to load analysis template", { error: err });

            await emit({
                topic: "send-line-message-request",
                data: {
                    userId,
                    message:
                        "Sorry, I'm having trouble accessing the analysis tools right now. Please try again later.",
                    replyToken,
                },
            });
            return;
        }

        // TODO: Replace with actual database query when database integration is ready
        // For now, simulate recent health logs
        const simulatedLogs = [
            {
                date: "2025-01-08",
                weight: "70kg",
                meal: "chicken salad",
                workout: "30-minute run",
            },
            {
                date: "2025-01-07",
                weight: "70.2kg",
                meal: "oatmeal with berries",
                workout: "yoga session",
            },
            {
                date: "2025-01-06",
                meal: "grilled salmon",
                workout: "weight training",
            },
            {
                date: "2025-01-05",
                weight: "70.5kg",
                meal: "quinoa bowl",
                workout: "cycling",
            },
            {
                date: "2025-01-04",
                meal: "protein smoothie",
                workout: "swimming",
            },
        ];

        // Render the prompt with simulated logs
        const prompt = Mustache.render(template, { logs: simulatedLogs });

        // Use OpenAI API for health analysis
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a professional health coach and nutritionist providing personalized health insights.

                    Guidelines for analysis:
                    - Focus on patterns in weight, nutrition, and exercise
                    - Provide specific, actionable recommendations
                    - Be encouraging and supportive
                    - Include both positive reinforcement and areas for improvement
                    - Use emojis to make the analysis engaging
                    - Keep it concise but comprehensive
                    - Structure the response with clear sections`,
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 700,
        });

        const summary =
            response.choices[0].message.content ||
            "Unable to generate a detailed analysis at this time. Please ensure you have some activity logs recorded and try again.";

        logger.info("OpenAI health analysis generated", {
            userId,
            analysisLength: summary.length,
        });

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: summary,
                replyToken,
            },
        });

        logger.info("Health analysis sent successfully", { userId });
    } catch (error: any) {
        logger.error("Health analysis failed", { userId, error });

        let fallbackMessage = "";

        // Check if it's a quota exceeded error
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            fallbackMessage = `⚠️ OpenAI 配額已用完，現在使用備用回應模式。

📊 **基本健康習慣分析**

雖然無法使用 AI 進行詳細分析，但這裡有一些通用建議：

**建議追蹤的日常習慣：**
• 體重（重視一致性而非每日變化）
• 營養（均衡飲食）
• 運動（有氧和力量訓練結合）
• 水分攝取（每日 8-10 杯水）
• 睡眠（每晚 7-9 小時）

**快速小貼士：**
✅ 定期記錄活動以獲得更好的洞察
✅ 專注於進步，而非完美
✅ 慶祝小勝利

持續追蹤你的活動，等配額恢復後我會提供更個人化的分析！💪

請稍後再請我分析你的習慣。`;
        } else {
            fallbackMessage = `📊 Health Analysis

I'm having trouble generating a detailed analysis right now, but here are some general health tips:

**Daily Habits to Track:**
• Weight (consistency matters more than daily changes)
• Nutrition (aim for balanced meals)
• Exercise (mix cardio and strength training)
• Hydration (8-10 glasses of water daily)
• Sleep (7-9 hours nightly)

**Quick Tips:**
✅ Log activities regularly for better insights
✅ Focus on progress, not perfection
✅ Celebrate small wins

Keep tracking your activities, and I'll provide more personalized insights as we gather more data! 💪

Try asking me to analyze your habits again later.`;
        }

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: fallbackMessage,
                replyToken,
            },
        });
    }
};
