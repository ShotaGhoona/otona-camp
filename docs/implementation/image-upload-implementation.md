# 画像アップロード機能実装ガイド

## 概要

Supabase Storageを使用した画像ファイルアップロード機能の実装が完了しました。
ユーザーは画像ファイルを直接アップロードできるようになり、URL入力も引き続き利用可能です。

## 実装内容

### 1. 新しく追加されたファイル

- `src/app/api/upload/route.ts` - 画像アップロードAPIエンドポイント
- `src/lib/upload.ts` - アップロード関連のヘルパー関数
- `src/components/ui/file-upload.tsx` - ファイルアップロード用UIコンポーネント
- `docs/setup/supabase-storage-setup.md` - Supabase Storage設定手順
- `test-upload.sh` - アップロード機能のテストスクリプト

### 2. 更新されたファイル

- `src/app/questions/[id]/answer/page.tsx` - 回答ページにファイルアップロード機能を追加

## 機能詳細

### ファイルアップロード機能
- **対応形式**: PNG, JPG, GIF などの画像ファイル
- **ファイルサイズ制限**: 5MB
- **アップロード方法**: ドラッグ&ドロップまたはファイル選択ダイアログ
- **プレビュー機能**: 選択した画像のプレビュー表示
- **バリデーション**: ファイルタイプとサイズの自動チェック

### フォールバック機能
- 画像URL入力機能も引き続き利用可能
- ファイルアップロードとURL入力は排他的（どちらか一方のみ選択可能）

## セットアップ手順

### 1. Supabase Storageの設定

```bash
# Supabaseダッシュボードで以下を実行:
# 1. Storage → Buckets → New bucket
# 2. バケット名: "images"
# 3. Public bucket: ✅ チェック
# 4. File size limit: 5MB
# 5. Allowed MIME types: image/*

# SQL Editorで以下を実行:
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');
```

### 2. 環境変数の確認

`.env.local` ファイルに以下が設定されていることを確認:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. アプリケーションの起動

```bash
npm run dev
```

### 4. テスト実行

```bash
./test-upload.sh
```

## 使用方法

### ユーザー側
1. 問題の回答画面で「画像ファイル」セクションを表示
2. 画像をドラッグ&ドロップまたはクリックして選択
3. プレビューを確認
4. 必要に応じてテキスト回答も追加
5. 「回答を送信」ボタンをクリック

### ゲームマスター側
- 問題作成時に `question_type` を `image` または `both` に設定
- 回答者が画像ファイルまたはURLのどちらでも回答可能

## エラーハンドリング

### クライアント側
- ファイルタイプの検証（画像ファイルのみ）
- ファイルサイズの検証（5MB制限）
- ネットワークエラーの表示

### サーバー側
- Supabase Storageアップロードエラーの処理
- 適切なHTTPステータスコードの返却
- 詳細なエラーメッセージの提供

## セキュリティ考慮事項

- 認証済みユーザーのみアップロード可能
- ファイルタイプの厳密な検証
- ファイルサイズの制限
- 公開バケットだが、適切なファイル命名規則

## パフォーマンス最適化

- ファイルサイズ制限による帯域幅節約
- プレビュー機能によるユーザビリティ向上
- アップロード中の適切なローディング表示

## トラブルシューティング

### よくある問題

1. **アップロードが失敗する**
   - Supabase Storageのバケット設定を確認
   - 環境変数が正しく設定されているか確認
   - ファイルサイズが5MB以下か確認

2. **画像が表示されない**
   - Supabase Storageの公開ポリシーを確認
   - アップロードされたURLが正しいか確認

3. **認証エラー**
   - ユーザーがログインしているか確認
   - Supabaseの認証設定を確認

## 今後の拡張可能性

- 画像の自動リサイズ機能
- 複数ファイルの同時アップロード
- 画像の編集機能（トリミング、フィルターなど）
- 動画ファイルのサポート
