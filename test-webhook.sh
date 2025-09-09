#!/bin/bash

# 測試 LINE webhook 端點
echo "Testing LINE webhook with health data message..."

curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @test-line-message.json \
  -v

echo -e "\n\nDone!"
