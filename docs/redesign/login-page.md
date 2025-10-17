今からあなたにはスタイルの修正を行なってもらいます
PoC開発の時に使ったデザインがすごくいいのでその時はreactで作成しましたが、、そちらを渡すのでそのデザインに合わせて下さい

あくまでデザインんの修正です
機能面は絶対に損なわないように注意して行いなさい

```jsx
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "名前を入力してください",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("userName", name.trim());
    setLocation("/team-select");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <i className="fas fa-gamepad text-5xl text-primary"></i>
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground">
            チーム対抗ゲーム
          </h1>
          <p className="text-muted-foreground">競争して、投票して、勝利しよう！</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-xl p-6 space-y-6 border border-card-border">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              あなたの名前
            </Label>
            <Input
              id="name"
              data-testid="input-name"
              type="text"
              placeholder="山田太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              className="h-12 text-base"
            />
          </div>

          <Button
            data-testid="button-login"
            onClick={handleLogin}
            className="w-full h-12 text-base font-semibold rounded-full"
            size="lg"
          >
            ログイン
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            ※ セキュリティなし<br />
            名前だけで参加OK
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>リアルタイム対戦ゲーム</p>
        </div>
      </div>
    </div>
  );
}


```