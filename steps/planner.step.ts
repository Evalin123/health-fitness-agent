import { EventConfig, Handlers } from "motia";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const config: EventConfig = {
    type: "event",
    name: "planner",
    description:
        "Generate tailored meal or workout plans for LINE users using OpenAI",
    subscribes: ["planner-request"],
    emits: ["send-line-message-request"],
    input: z.object({
        userId: z.string(),
        intent: z.enum(["plan_meal", "plan_workout"]),
        message: z.string(),
        replyToken: z.string(),
    }),
    flows: ["health-companion"],
};

export const handler = async (input: any, { emit, logger }: any) => {
    const { userId, message, intent, replyToken } = input;

    logger.info(`Planner request from ${userId}: ${message} (${intent})`);

    try {
        // Use OpenAI API for generating personalized plans
        const systemPrompt =
            intent === "plan_meal"
                ? `You are a professional nutritionist and meal planning expert. Create personalized, healthy meal plans based on user requests. 

            Guidelines:
            - Include breakfast, lunch, dinner, and 2 snacks
            - Provide specific foods with approximate portions
            - Consider nutritional balance (protein, carbs, healthy fats)
            - Make suggestions practical and accessible
            - Include hydration reminders
            - Use emojis to make it engaging
            - Keep it concise but informative`
                : `You are a certified personal trainer and fitness expert. Create personalized workout plans based on user requests.

            Guidelines:
            - Include warm-up, main workout, and cool-down
            - Provide specific exercises with sets, reps, or duration
            - Consider different fitness levels (beginner, intermediate, advanced)
            - Include safety tips and modifications
            - Make it practical for home or gym
            - Use emojis to make it engaging
            - Keep it concise but comprehensive`;

        const userPrompt =
            intent === "plan_meal"
                ? `Create a healthy meal plan based on this request: "${message}". Make it practical, nutritious, and tailored to their needs.`
                : `Create a workout plan based on this request: "${message}". Make it suitable for their fitness level and goals mentioned in their message.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
        });

        const planResponse =
            response.choices[0].message.content ||
            "Sorry, I couldn't generate a plan right now. Please try again.";

        logger.info("OpenAI plan generated successfully", {
            userId,
            intent,
            messageLength: planResponse.length,
        });

        await emit({
            topic: "send-line-message-request",
            data: {
                userId,
                message: planResponse,
                replyToken,
            },
        });

        logger.info("Planner response sent", { userId, intent });
    } catch (error: any) {
        logger.error("Planner failed with OpenAI", { userId, intent, error });

        let fallbackResponse = "";

        // Check if it's a quota exceeded error
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            if (intent === "plan_meal") {
                fallbackResponse = `⚠️ OpenAI 配額已用完，現在使用備用回應模式。

🍽️ **基本健康餐點建議**：

**早餐**：
• 燕麥粥配莓果和堅果
• 希臘優格
• 綠茶

**午餐**：
• 烤雞肉沙拉配蔬菜
• 藜麥
• 檸檬水

**晚餐**：
• 烤鮭魚
• 蒸蔬菜
• 糙米

**點心**：
• 蘋果配杏仁醬
• 綜合堅果

保持均衡飲食！🌟`;
            } else {
                fallbackResponse = `⚠️ OpenAI 配額已用完，現在使用備用回應模式。

💪 **基本運動計劃**：

**熱身 (5分鐘)**：
• 輕慢跑
• 動態伸展

**主要運動 (25分鐘)**：
• 伏地挺身：3組，每組10次
• 深蹲：3組，每組15次
• 平板支撐：3組，每組30秒
• 弓箭步：3組，每邊10次

**緩和 (5分鐘)**：
• 靜態伸展
• 深呼吸

記得補充水分！💧`;
            }
        } else {
            fallbackResponse =
                intent === "plan_meal"
                    ? "Sorry, I'm having trouble generating a meal plan right now. Please try asking for a specific type of meal plan (like 'healthy breakfast ideas' or 'vegetarian lunch plan')."
                    : "Sorry, I'm having trouble generating a workout plan right now. Please try asking for a specific type of workout (like 'beginner home workout' or '30-minute cardio routine').";
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
