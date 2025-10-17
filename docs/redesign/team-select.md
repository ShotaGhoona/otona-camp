```

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamWithStats } from "@shared/schema";

export default function TeamSelect() {
  const [, setLocation] = useLocation();
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    if (!userName) {
      setLocation("/login");
    }
  }, [userName, setLocation]);

  const { data: teams, isLoading } = useQuery<{ teams: TeamWithStats[] }>({
    queryKey: ["/api/teams"],
    enabled: !!userName,
  });

  const handleJoinTeam = async (teamId: string) => {
    if (!userName) return;

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, teamId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to join team");
      }

      setLocation("/questions");
    } catch (error) {
      console.error("Error joining team:", error);
    }
  };

  const teamColors: Record<string, string> = {
    "#FF6B6B": "bg-[#FF6B6B]",
    "#4ECDC4": "bg-[#4ECDC4]",
    "#95E77D": "bg-[#95E77D]",
    "#FFE66D": "bg-[#FFE66D]",
    "#A78BFA": "bg-[#A78BFA]",
    "#FB923C": "bg-[#FB923C]",
  };

  if (!userName) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            data-testid="button-back"
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/login")}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-heading font-bold">チーム選択</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Welcome Message */}
        <div className="text-center py-4">
          <p className="text-lg">
            ようこそ、<span className="font-bold text-primary">{userName}</span>さん
          </p>
        </div>

        {/* Existing Teams */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">既存のチームに参加</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : teams?.teams && teams.teams.length > 0 ? (
            <div className="space-y-3">
              {teams.teams.map((team) => (
                <Card
                  key={team.id}
                  data-testid={`card-team-${team.id}`}
                  className="p-4 border-l-4 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  style={{ borderLeftColor: team.color }}
                  onClick={() => handleJoinTeam(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${teamColors[team.color] || 'bg-primary'} flex items-center justify-center`}
                      >
                        <i className="fas fa-users text-white"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.memberCount}人
                        </p>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <i className="fas fa-users text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">まだチームがありません</p>
            </Card>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground">
              または
            </span>
          </div>
        </div>

        {/* Create New Team */}
        <Button
          data-testid="button-create-team"
          onClick={() => setLocation("/team-setup")}
          className="w-full h-12 text-base font-semibold rounded-full"
          variant="outline"
          size="lg"
        >
          <i className="fas fa-plus mr-2"></i>
          新しいチームを作る
        </Button>
      </div>
    </div>
  );
}

```