#!/bin/bash

# 快速測試不同的健康訊息類型

echo "🧪 測試健康資料提取功能"
echo "================================"

# 測試1: 健康資料記錄
echo "1️⃣ 測試健康資料記錄..."
curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479859,
      "source": {"type": "user", "userId": "test-user"},
      "message": {"id": "1", "type": "text", "text": "I weighed 72kg today, had a spinach salad for lunch, and did a 20-minute jog"},
      "replyToken": "test-token-1"
    }]
  }'
echo -e "\n"

# 測試2: 餐點規劃
echo "2️⃣ 測試餐點規劃請求..."
curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479859,
      "source": {"type": "user", "userId": "test-user"},
      "message": {"id": "2", "type": "text", "text": "Can you suggest a healthy meal plan for dinner?"},
      "replyToken": "test-token-2"
    }]
  }'
echo -e "\n"

# 測試3: 運動規劃
echo "3️⃣ 測試運動規劃請求..."
curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479859,
      "source": {"type": "user", "userId": "test-user"},
      "message": {"id": "3", "type": "text", "text": "I need a workout plan for beginners"},
      "replyToken": "test-token-3"
    }]
  }'

echo -e "\n✅ 測試完成！請查看 http://localhost:3000 的 Workbench 來檢視詳細結果"
