今からあなたにはスタイルの修正を行なってもらいます
PoC開発の時に使ったデザインがすごくいいのでその時はreactで作成しましたが、、そちらを渡すのでそのデザインに合わせて下さい

あくまでデザインんの修正です
機能面は絶対に損なわないように注意して行いなさい


```tsx
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { QuestionWithDetails, OptionWithDetails, VoteWithDetails } from "@shared/schema";

export default function QuestionVote() {
  const [, params] = useRoute("/questions/:id/vote");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const memberId = localStorage.getItem("memberId");

  const { data: question } = useQuery<QuestionWithDetails>({
    queryKey: ["/api/questions", params?.id],
    enabled: !!params?.id && !!memberId,
  });

  const { data: optionsData } = useQuery<{ options: OptionWithDetails[] }>({
    queryKey: ["/api/questions", params?.id, "options"],
    enabled: !!params?.id && !!memberId,
    refetchInterval: 3000,
  });

  const { data: myVoteData } = useQuery<VoteWithDetails | { voted: false }>({
    queryKey: ["/api/questions", params?.id, "votes", "me"],
    enabled: !!params?.id && !!memberId,
    refetchInterval: 3000,
  });

  const handleVote = async (optionId: string) => {
    // Will be implemented in backend integration
    toast({
      title: "投票完了",
      description: "投票しました！",
    });
  };

  const myVoted = myVoteData && 'voted' in myVoteData ? myVoteData.voted : false;

  if (!question) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            data-testid="button-back"
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/questions")}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-base font-heading font-bold">
            Q{1}/{10}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Progress Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <i className="fas fa-check text-muted-foreground text-sm"></i>
              </div>
              <span className="text-sm text-muted-foreground">回答</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-check text-primary-foreground text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-primary">投票</span>
            </div>
            <div className="flex-1 h-0.5 bg-border mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                <span className="text-sm text-muted-foreground">3</span>
              </div>
              <span className="text-sm text-muted-foreground">結果</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">Step 2/3</p>
        </div>

        {/* Voting Instructions */}
        <Card className="p-6 space-y-2 border-l-4 border-l-chart-3">
          <h2 className="text-xl font-heading font-bold">【投票してください】</h2>
          <p className="text-muted-foreground">どの回答が一番いい？</p>
        </Card>

        {/* My Vote Status */}
        {myVoted && myVoteData && 'vote' in myVoteData && (
          <Card className="p-4 bg-chart-3/10 border-chart-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-3 flex items-center justify-center">
                <i className="fas fa-check text-white"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-chart-3">投票済み</p>
                <p className="text-sm text-muted-foreground">
                  {myVoteData.vote.teamName} に投票しました
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Options List */}
        <div className="space-y-4">
          {optionsData?.options.map((option) => (
            <Card
              key={option.id}
              data-testid={`card-option-${option.id}`}
              className={`
                p-6 space-y-4 border-t-4 transition-all
                ${!option.isMyTeam && !myVoted ? 'hover-elevate active-elevate-2' : ''}
              `}
              style={{ borderTopColor: option.teamColor }}
            >
              {/* Team Name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: option.teamColor }}
                >
                  <i className="fas fa-users text-white text-sm"></i>
                </div>
                <h3 className="font-semibold text-lg">
                  {option.teamName}
                  {option.isMyTeam && (
                    <Badge variant="secondary" className="ml-2">自分</Badge>
                  )}
                </h3>
              </div>

              {/* Answer Content */}
              <div className="p-4 bg-muted/30 rounded-lg">
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={`${option.teamName}の回答`}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <p className="text-xl font-semibold text-center py-4">
                    {option.content}
                  </p>
                )}
              </div>

              {/* Vote Button */}
              {option.isMyTeam ? (
                <Button
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  <i className="fas fa-ban mr-2"></i>
                  投票不可（自分のチーム）
                </Button>
              ) : myVoted ? (
                <Button
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  投票済み
                </Button>
              ) : (
                <Button
                  data-testid={`button-vote-${option.id}`}
                  onClick={() => handleVote(option.id)}
                  className="w-full h-12 text-base font-semibold rounded-full"
                >
                  <i className="fas fa-check-to-slot mr-2"></i>
                  投票する
                </Button>
              )}
            </Card>
          ))}
        </div>

        {!myVoted && (
          <p className="text-sm text-muted-foreground text-center py-4">
            ※ 自分のチームには投票できません
          </p>
        )}
      </div>
    </div>
  );
}


```