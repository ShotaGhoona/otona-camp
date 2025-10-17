```tsx
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { QuestionWithDetails, Member } from "@shared/schema";

const STATUS_CONFIG = {
  draft: {
    icon: "fa-lock",
    label: "準備中",
    color: "text-muted-foreground",
    disabled: true,
  },
  active: {
    icon: "fa-pencil",
    label: "回答中",
    color: "text-primary",
    disabled: false,
    pulse: true,
  },
  voting: {
    icon: "fa-check-to-slot",
    label: "投票中",
    color: "text-chart-3",
    disabled: false,
  },
  finished: {
    icon: "fa-circle-check",
    label: "完了",
    color: "text-muted-foreground",
    disabled: false,
  },
};

export default function Questions() {
  const [location, setLocation] = useLocation();
  const memberId = localStorage.getItem("memberId");

  useEffect(() => {
    if (!memberId) {
      setLocation("/login");
    }
  }, [memberId, setLocation]);

  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members/me"],
    enabled: !!memberId,
  });

  const { data: questions, isLoading } = useQuery<{ questions: QuestionWithDetails[] }>({
    queryKey: ["/api/questions"],
    enabled: !!memberId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  const handleQuestionClick = (questionId: string, status: string) => {
    if (status === 'draft') return;
    
    if (status === 'active') {
      setLocation(`/questions/${questionId}/answer`);
    } else if (status === 'voting') {
      setLocation(`/questions/${questionId}/vote`);
    } else if (status === 'finished') {
      setLocation(`/questions/${questionId}/results`);
    }
  };

  if (!memberId) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon">
            <i className="fas fa-bars"></i>
          </Button>
          <h1 className="text-xl font-heading font-bold">問題一覧</h1>
          <Button variant="ghost" size="icon">
            <i className="fas fa-user-circle"></i>
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Team Info */}
        {member?.team && (
          <Card className="p-4 border-l-4" style={{ borderLeftColor: member.team.color }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: member.team.color }}
                >
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{member.team.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    あなたのチーム
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-heading font-bold text-primary">
                  {member.team.score}
                </div>
                <p className="text-xs text-muted-foreground">ポイント</p>
              </div>
            </div>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : questions?.questions && questions.questions.length > 0 ? (
            <>
              {questions.questions.map((question, index) => {
                const config = STATUS_CONFIG[question.status as keyof typeof STATUS_CONFIG];
                
                return (
                  <Card
                    key={question.id}
                    data-testid={`card-question-${question.id}`}
                    className={`
                      p-4 border-l-4 transition-all
                      ${!config.disabled ? 'hover-elevate active-elevate-2 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                    `}
                    style={{
                      borderLeftColor: config.disabled ? 'var(--muted)' : 
                        question.status === 'active' ? 'var(--primary)' :
                        question.status === 'voting' ? 'var(--chart-3)' :
                        'var(--muted)'
                    }}
                    onClick={() => !config.disabled && handleQuestionClick(question.id, question.status)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <i className={`fas ${config.icon} ${config.color} text-xl mt-1 ${config.pulse ? 'animate-pulse' : ''}`}></i>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base line-clamp-2">
                              Q{index + 1}: {question.title}
                            </h3>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {question.points}pt
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={config.color}>
                          {config.label}
                        </span>
                        {question.timeLimit && question.status === 'active' && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              <i className="fas fa-clock mr-1"></i>
                              {Math.floor(question.timeLimit / 60)}分
                            </span>
                          </>
                        )}
                        {question.status === 'active' && question.answeredTeams !== undefined && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {question.answeredTeams}/{question.totalTeams} チーム回答済
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card className="p-12 text-center">
              <i className="fas fa-inbox text-5xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">問題がありません</p>
              <p className="text-sm text-muted-foreground">
                ゲームマスターが問題を作成するまでお待ちください
              </p>
            </Card>
          )}
        </div>

        {/* Scoreboard Button */}
        <Button
          data-testid="button-scoreboard"
          onClick={() => setLocation("/scoreboard")}
          variant="outline"
          className="w-full h-12 text-base font-semibold rounded-full"
        >
          <i className="fas fa-trophy mr-2"></i>
          スコアボードを見る
        </Button>
      </div>
    </div>
  );
}


```