#!/bin/bash

echo "🧪 Testing Health Data Extraction"
echo "================================="
echo "Input: \"I weighed 72kg today, had a spinach salad for lunch, and did a 20-minute jog\""
echo ""
echo "Expected Output:"
echo "{"
echo "  \"activities\": ["
echo "    {"
echo "      \"weight\": \"72kg\","
echo "      \"meal\": \"spinach salad\","
echo "      \"workout\": \"20-minute jog\""
echo "    }"
echo "  ]"
echo "}"
echo ""
echo "🚀 Sending test message..."

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test-extraction",
    "events": [{
      "type": "message",
      "timestamp": 1462629479859,
      "source": {"type": "user", "userId": "test-user-001"},
      "message": {
        "id": "health-data-test-001", 
        "type": "text", 
        "text": "I weighed 72kg today, had a spinach salad for lunch, and did a 20-minute jog"
      },
      "replyToken": "test-reply-token-001"
    }]
  }' | jq '.' 2>/dev/null || echo "Response received (no jq installed)"

echo ""
echo "✅ Test completed!"
echo "📊 Check the Motia Workbench at http://localhost:3000 to see:"
echo "   1. Message received and processed"
echo "   2. Intent classified as 'log_activity'"
echo "   3. Activity data extracted with weight, meal, and workout"
echo "   4. Individual activity log events emitted"
