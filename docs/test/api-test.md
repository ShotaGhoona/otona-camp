# API テストドキュメント

このドキュメントのコマンドをコピペしてAPIをテストできます。  
開発サーバー起動: `npm run dev`

## テスト用認証情報

```
Member ID: aaaa1111-aaaa-1111-aaaa-111111111111 (山田太郎 - チームA)
Team ID: 11111111-1111-1111-1111-111111111111 (チームA)
```

---

## 1. チーム管理

### 1.1 チーム一覧取得
```bash
curl -X GET http://localhost:3000/api/teams
```

### 1.2 チーム作成
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "チームE",
    "color": "#FF00FF"
  }'
```

---

## 2. メンバー管理

### 2.1 メンバー登録（ログイン）
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テスト太郎",
    "team_id": "11111111-1111-1111-1111-111111111111"
  }'
```

### 2.2 自分の情報取得
```bash
curl -X GET http://localhost:3000/api/members/me \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111"
```

---

## 3. 問題管理

### 3.1 問題一覧取得
```bash
# 全問題
curl -X GET http://localhost:3000/api/questions

# ステータスでフィルター
curl -X GET "http://localhost:3000/api/questions?status=active"
```

### 3.2 問題作成（ゲームマスター用）
```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "あなたのチームの座右の銘は？",
    "description": "チームを表す座右の銘を考えてください",
    "question_type": "text",
    "time_limit": 120,
    "points": 200
  }'
```

### 3.3 問題詳細取得
```bash
# activeな問題を取得（a3333333-3333-3333-3333-333333333333）
curl -X GET http://localhost:3000/api/questions/a3333333-3333-3333-3333-333333333333 \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111"
```

### 3.4 問題ステータス更新
```bash
# draftからactiveへ
curl -X PATCH http://localhost:3000/api/questions/a4444444-4444-4444-4444-444444444444/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'

# activeからvotingへ
curl -X PATCH http://localhost:3000/api/questions/a3333333-3333-3333-3333-333333333333/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "voting"
  }'
```

---

## 4. 回答（Option）管理

### 4.1 回答一覧取得
```bash
# 投票中の問題の回答一覧（a2222222-2222-2222-2222-222222222222）
curl -X GET http://localhost:3000/api/questions/a2222222-2222-2222-2222-222222222222/options \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111"
```

### 4.2 回答作成
```bash
# activeな問題（a3333333-3333-3333-3333-333333333333）に回答
curl -X POST http://localhost:3000/api/questions/a3333333-3333-3333-3333-333333333333/options \
  -H "Content-Type: application/json" \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111" \
  -H "X-Team-ID: 11111111-1111-1111-1111-111111111111" \
  -d '{
    "content": "一致団結"
  }'

# 画像で回答
curl -X POST http://localhost:3000/api/questions/a3333333-3333-3333-3333-333333333333/options \
  -H "Content-Type: application/json" \
  -H "Authorization: bbbb1111-bbbb-1111-bbbb-111111111111" \
  -H "X-Team-ID: 22222222-2222-2222-2222-222222222222" \
  -d '{
    "image_url": "https://example.com/image.jpg"
  }'
```

---

## 5. 投票管理

### 5.1 投票する
```bash
# 投票中の問題（a2222222-2222-2222-2222-222222222222）で投票
# チームAのメンバーがチームBの回答に投票
curl -X POST http://localhost:3000/api/questions/a2222222-2222-2222-2222-222222222222/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: aaaa2222-aaaa-2222-aaaa-222222222222" \
  -d '{
    "option_id": "e2222222-2222-2222-2222-222222222222"
  }'

# エラーケース: 自分のチームには投票できない
curl -X POST http://localhost:3000/api/questions/a2222222-2222-2222-2222-222222222222/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111" \
  -d '{
    "option_id": "e2222221-2222-2222-2222-111111111111"
  }'
```

---

## 6. 結果・スコアボード

### 6.1 結果取得
```bash
# 完了済みの問題（a1111111-1111-1111-1111-111111111111）の結果
curl -X GET http://localhost:3000/api/questions/a1111111-1111-1111-1111-111111111111/results
```

### 6.2 スコアボード取得
```bash
curl -X GET http://localhost:3000/api/scoreboard
```

---

## エラーケースのテスト

### 認証エラー
```bash
# Authorizationヘッダーなし
curl -X GET http://localhost:3000/api/members/me
```

### 不正なステータス遷移
```bash
# finishedからactiveには戻せない
curl -X PATCH http://localhost:3000/api/questions/a1111111-1111-1111-1111-111111111111/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### 重複投稿
```bash
# 同じ問題に2回投票（エラーになるはず）
curl -X POST http://localhost:3000/api/questions/a2222222-2222-2222-2222-222222222222/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111" \
  -d '{
    "option_id": "e2222223-2222-2222-2222-333333333333"
  }'
```

---

## テストシナリオ

### シナリオ1: 新規チーム参加フロー
1. チーム作成
2. メンバー登録
3. 自分の情報確認
4. 問題一覧確認

### シナリオ2: ゲームフロー
1. 問題作成（draft）
2. 問題をactiveに変更
3. 各チームが回答
4. 問題をvotingに変更
5. 各メンバーが投票
6. 問題をfinishedに変更
7. 結果確認
8. スコアボード確認

---

## 便利なテストスクリプト

### 全APIの疎通確認
```bash
# test-all-apis.sh として保存して実行
#!/bin/bash

echo "=== チーム一覧 ==="
curl -s http://localhost:3000/api/teams | jq '.teams[0]'

echo -e "\n=== 自分の情報 ==="
curl -s http://localhost:3000/api/members/me \
  -H "Authorization: aaaa1111-aaaa-1111-aaaa-111111111111" | jq '.'

echo -e "\n=== 問題一覧 ==="
curl -s http://localhost:3000/api/questions | jq '.questions[] | {id, title, status}'

echo -e "\n=== スコアボード ==="
curl -s http://localhost:3000/api/scoreboard | jq '.teams[] | {rank, team_name, score}'
```