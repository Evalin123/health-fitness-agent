# AI Health & Fitness Agent

An intelligent health and fitness companion built with the Motia framework that integrates with LINE messaging to provide personalized health advice, activity tracking, meal planning, and workout recommendations.

## 🌟 Features

-   **Smart Activity Logging**: Natural language processing to extract health activities from user messages (e.g., "I weighed 70kg and had a salad")
-   **Meal Planning**: AI-powered meal plan generation based on user preferences and dietary goals
-   **Workout Planning**: Personalized workout routines and exercise recommendations
-   **Health Analysis**: Comprehensive analysis of user habits and health patterns
-   **Conversational AI**: Intelligent health conversations using OpenAI GPT-4
-   **LINE Integration**: Seamless interaction through LINE messaging platform
-   **Real-time Processing**: Event-driven architecture for instant responses

## 🏗️ Architecture

This application is built using the Motia framework with an event-driven architecture consisting of several specialized steps:

### Core Steps

-   **`classify-user-intent`**: Analyzes incoming messages to determine user intent (meal planning, workout planning, activity logging, habit analysis)
-   **`user-activity-extract`**: Extracts health and fitness data from natural language user input
-   **`planner`**: Generates personalized meal plans and workout routines based on user requests
-   **`analyzer`**: Provides comprehensive health analysis and insights
-   **`health-chat`**: Handles general health conversations with AI assistance
-   **`send-line-message`**: Manages LINE message delivery with proper error handling

### LINE Webhook Integration

-   **`line-webhook`**: Processes incoming LINE webhook events
-   **`line-webhook-verify`**: Handles LINE webhook verification

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+
-   pnpm package manager
-   OpenAI API key
-   LINE Messaging API credentials
-   localtunnel (for development webhook testing): `npm install -g localtunnel`

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd health-fitness-agent
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# LINE Messaging API Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Optional: Database and Redis (for production)
# DATABASE_URL=your_database_connection_string
# REDIS_URL=your_redis_connection_string
```

4. **Start the development server**

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

5. **Expose local server for LINE webhook (Development)**

For LINE Bot development, you need a public HTTPS URL. Use localtunnel:

```bash
# Install localtunnel globally (if not already installed)
npm install -g localtunnel

# Create a public tunnel to your local server
lt --port 3000 --subdomain health-bot-$(date +%s)
```

This will provide a public URL like `https://health-bot-1234567890.loca.lt` that you can use as your LINE webhook URL.

### Testing the Application

**Test LINE webhook integration:**

```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

**Test health data extraction:**

```bash
chmod +x test-health-extraction.sh
./test-health-extraction.sh
```

**Test various data extractions:**

```bash
chmod +x test-various-extractions.sh
./test-various-extractions.sh
```

## 🔧 Configuration

### Environment Variables

| Variable                    | Required | Description                                  |
| --------------------------- | -------- | -------------------------------------------- |
| `OPENAI_API_KEY`            | Yes      | OpenAI API key for AI-powered features       |
| `LINE_CHANNEL_ACCESS_TOKEN` | Yes      | LINE Messaging API channel access token      |
| `LINE_CHANNEL_SECRET`       | Optional | LINE channel secret for webhook verification |
| `DATABASE_URL`              | Optional | Database connection string for persistence   |
| `REDIS_URL`                 | Optional | Redis URL for state management               |

### LINE Bot Setup

1. Create a LINE Messaging API channel at [LINE Developers Console](https://developers.line.biz/)
2. Get your Channel Access Token and Channel Secret
3. Set the webhook URL:
    - **Development**: Use your localtunnel URL (e.g., `https://health-bot-1234567890.loca.lt/webhook`)
    - **Production**: Use your production domain (e.g., `https://your-domain.com/webhook`)
4. Enable webhook in the LINE Console
5. Verify webhook is working by sending a test message to your bot

**Development Webhook Setup:**

```bash
# Start your local server
pnpm dev

# In another terminal, create the tunnel
lt --port 3000 --subdomain health-bot-$(date +%s)

# Copy the generated URL and add /webhook to it
# Example: https://health-bot-1234567890.loca.lt/webhook
```

## 💬 Usage Examples

### Activity Logging

Users can log activities naturally:

```
"I weighed 70kg this morning"
"Had a grilled chicken salad for lunch"
"Ran 5km in 30 minutes"
"Slept 8 hours last night"
```

### Meal Planning

Request meal plans:

```
"Suggest a meal plan for weight loss"
"I need a vegetarian meal plan"
"Create a high-protein diet plan"
```

### Workout Planning

Get workout recommendations:

```
"I need a beginner workout plan"
"Suggest exercises for building muscle"
"Create a home workout routine"
```

### Health Analysis

Analyze patterns:

```
"Analyze my eating habits"
"Show my fitness progress"
"Give me health insights"
```

## 🧪 Testing

The project includes comprehensive test scripts:

-   `test-webhook.sh`: Tests LINE webhook integration
-   `test-health-extraction.sh`: Tests activity data extraction
-   `test-various-extractions.sh`: Tests various extraction scenarios
-   `test-planner.sh`: Tests meal and workout planning

Test data is provided in JSON files for consistent testing.

## 📁 Project Structure

```
health-fitness-agent/
├── steps/                          # Motia workflow steps
│   ├── classify-user-intent.step.ts # Intent classification
│   ├── user-activity-extract.step.ts# Activity data extraction
│   ├── planner.step.ts             # Meal/workout planning
│   ├── analyzer.step.ts            # Health analysis
│   ├── health-chat.step.ts         # Conversational AI
│   ├── send-line-message.step.ts   # LINE message sending
│   ├── line-webhook.step.ts        # LINE webhook handler
│   └── line-webhook-verify.step.ts # Webhook verification
├── prompts/                        # AI prompt templates
│   ├── analyze-health.mustache     # Health analysis prompts
│   ├── classify-intent.mustache    # Intent classification
│   └── user-activity-extract.mustache # Activity extraction
├── services/                       # External service integrations
├── test-*.sh                       # Test scripts
├── test-*.json                     # Test data
└── package.json                    # Dependencies and scripts
```

## 🚀 Deployment

### Production Environment Variables

```bash
# Required
OPENAI_API_KEY=your_production_openai_key
LINE_CHANNEL_ACCESS_TOKEN=your_production_line_token

# Production databases
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port

# Optional: Monitoring and logging
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### Using Docker

```bash
# Build the container
docker build -t health-fitness-agent .

# Run with environment variables
docker run -p 3000:3000 --env-file .env health-fitness-agent
```

### Deploy to Production

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

## 🔍 Monitoring

The application provides built-in monitoring and logging:

-   Structured logging with trace IDs
-   Health check endpoint at `/health`
-   Performance metrics tracking
-   Error tracking and alerting

## 📝 API Endpoints

### Webhook Endpoints

-   `GET /webhook` - LINE webhook verification
-   `POST /webhook` - LINE message processing

### Health Endpoints

-   `GET /health` - Application health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the test scripts for usage examples
2. Review the Motia framework documentation
3. Create an issue in this repository

---

Built with ❤️ using [Motia Framework](https://motia.dev) - The unified framework for building any type of production-ready backend.
