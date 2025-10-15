#!/bin/bash

# APIテストスクリプト

BASE_URL="http://localhost:3000/api"

echo "=== チーム一覧取得 ==="
curl -X GET "$BASE_URL/teams"

echo -e "\n\n=== チーム作成 ==="
curl -X POST "$BASE_URL/teams" \
  -H "Content-Type: application/json" \
  -d '{"name": "チームA", "color": "#FF6B6B"}'

echo -e "\n\n=== 再度チーム一覧取得 ==="
curl -X GET "$BASE_URL/teams"