#!/bin/bash

echo "🧪 Testing LINE Planner Function"
echo "================================"

# Test 1: Meal Planning Request
echo ""
echo "Test 1: Meal Planning Request"
echo "-----------------------------"
echo "Input: \"Can you suggest a healthy meal plan for dinner?\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test-planner",
    "events": [{
      "type": "message",
      "timestamp": 1462629479863,
      "source": {"type": "user", "userId": "planner-test-001"},
      "message": {"id": "meal-plan-test", "type": "text", "text": "Can you suggest a healthy meal plan for dinner?"},
      "replyToken": "meal-plan-token"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: Intent=plan_meal, Response=meal plan with breakfast/lunch/dinner"

# Test 2: Workout Planning Request  
echo ""
echo "Test 2: Workout Planning Request"
echo "--------------------------------"
echo "Input: \"I need a workout plan for beginners\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test-planner",
    "events": [{
      "type": "message", 
      "timestamp": 1462629479864,
      "source": {"type": "user", "userId": "planner-test-002"},
      "message": {"id": "workout-plan-test", "type": "text", "text": "I need a workout plan for beginners"},
      "replyToken": "workout-plan-token"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: Intent=plan_workout, Response=workout plan with warm-up/main/cool-down"

# Test 3: General Planning Request
echo ""
echo "Test 3: General Planning Request"
echo "--------------------------------"
echo "Input: \"Please recommend something healthy\""

curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "test-planner",
    "events": [{
      "type": "message",
      "timestamp": 1462629479865, 
      "source": {"type": "user", "userId": "planner-test-003"},
      "message": {"id": "general-plan-test", "type": "text", "text": "Please recommend something healthy"},
      "replyToken": "general-plan-token"
    }]
  }' > /dev/null

echo "✅ Sent - Expected: Intent classification based on keywords"

echo ""
echo "🔍 All planner tests completed!"
echo "📊 Check http://localhost:3000 Workbench to see:"
echo "   1. Intent classification (plan_meal/plan_workout)"
echo "   2. Planner step activation"
echo "   3. Generated meal/workout plans"
echo "   4. send-line-message-request events emitted"
