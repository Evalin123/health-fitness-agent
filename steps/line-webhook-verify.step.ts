import { ApiRouteConfig } from "motia";

export const config: ApiRouteConfig = {
    type: "api",
    name: "line-webhook-verify",
    description: "Handle LINE webhook verification (GET request)",
    path: "/webhook",
    method: "GET",
    emits: [],
    flows: ["health-companion"],
};

export const handler = async (req: any, { logger }: any) => {
    // LINE webhook verification - just return 200 OK
    logger.info("LINE webhook verification request received", {
        userAgent: req.headers?.["user-agent"],
        origin: req.headers?.origin,
    });

    return {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: {
            message: "LINE webhook endpoint is ready",
            timestamp: Date.now(),
        },
    };
};
