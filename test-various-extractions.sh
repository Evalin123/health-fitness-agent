#!/bin/bash

echo "🧪 Testing Various Health Data Extractions"
echo "=========================================="

# Test 1: Complete health data (weight + meal + workout)
echo ""
echo "Test 1: Complete Health Data"
echo "----------------------------"
echo "Input: \"I weighed 72kg today, had a spinach salad for lunch, and did a 20-minute jog\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479859,
      "source": {"type": "user", "userId": "test-user-001"},
      "message": {"id": "1", "type": "text", "text": "I weighed 72kg today, had a spinach salad for lunch, and did a 20-minute jog"},
      "replyToken": "token-1"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: weight=72kg, meal=spinach salad, workout=20-minute jog"

# Test 2: Only weight
echo ""
echo "Test 2: Weight Only"
echo "-------------------"
echo "Input: \"I weighed 68kg this morning\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479860,
      "source": {"type": "user", "userId": "test-user-002"},
      "message": {"id": "2", "type": "text", "text": "I weighed 68kg this morning"},
      "replyToken": "token-2"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: weight=68kg"

# Test 3: Only workout
echo ""
echo "Test 3: Workout Only"
echo "--------------------"
echo "Input: \"Did a 30-minute run this evening\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479861,
      "source": {"type": "user", "userId": "test-user-003"},
      "message": {"id": "3", "type": "text", "text": "Did a 30-minute run this evening"},
      "replyToken": "token-3"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: workout=30-minute run (or similar)"

# Test 4: Only meal
echo ""
echo "Test 4: Meal Only"
echo "-----------------"
echo "Input: \"Had a healthy salad for dinner\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test",
    "events": [{
      "type": "message",
      "timestamp": 1462629479862,
      "source": {"type": "user", "userId": "test-user-004"},
      "message": {"id": "4", "type": "text", "text": "Had a healthy salad for dinner"},
      "replyToken": "token-4"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: meal=dinner (or salad)"

echo ""
echo "🔍 All tests completed!"
echo "📊 Check http://localhost:3000 Workbench to see detailed results for each test"
echo "🎯 Look for:"
echo "   - Intent classification: 'log_activity' for all tests"
echo "   - Activity extraction with correct data parsing"
echo "   - Individual activity log events for each extracted piece of data"
