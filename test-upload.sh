#!/bin/bash

# 画像アップロード機能のテストスクリプト

echo "=== 画像アップロード機能テスト ==="

# テスト用の画像ファイルを作成（1x1の透明PNG）
echo "テスト用画像ファイルを作成中..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image-actual.png

echo "画像アップロードテストを実行中..."
echo "ファイル: test-image-actual.png"

# curlでアップロードテスト
curl -X POST http://localhost:3003/api/upload \
  -F "file=@test-image-actual.png" \
  -H "Content-Type: multipart/form-data" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "=== テスト完了 ==="

# テストファイルを削除
rm -f test-image-actual.png
