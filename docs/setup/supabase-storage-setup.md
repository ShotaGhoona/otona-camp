# Supabase Storage 設定手順

## 1. バケットの作成

Supabaseダッシュボードで以下の手順を実行：

1. **Storage** → **Buckets** → **New bucket**
2. バケット名: `images`
3. Public bucket: ✅ チェック（画像を公開でアクセス可能にする）
4. File size limit: `5MB`（適宜調整）
5. Allowed MIME types: `image/*`

## 2. ストレージポリシーの設定

以下のSQLをSupabaseのSQL Editorで実行：

```sql
-- 画像アップロード用ポリシー（認証済みユーザーのみ）
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- 画像読み取り用ポリシー（全員がアクセス可能）
CREATE POLICY "Allow public access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 画像削除用ポリシー（認証済みユーザーのみ）
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);
```

## 3. 環境変数の確認

`.env.local` ファイルに以下が設定されていることを確認：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
