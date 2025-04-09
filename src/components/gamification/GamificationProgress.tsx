import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Award, Target, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface GamificationProgressProps {
  points: number;
  level: number;
  streak?: {
    current: number;
    longest: number;
  };
  certificatesCount?: number;
  skillsCount?: number;
  verifiedCertificatesCount?: number;
}

const levelThresholds = [
  { level: 1, points: 0, name: "Beginner" },
  { level: 2, points: 100, name: "Explorer" },
  { level: 5, points: 400, name: "Achiever" },
  { level: 10, points: 900, name: "Expert" },
  { level: 20, points: 1900, name: "Master" },
  { level: 30, points: 2900, name: "Legend" }
];

const GamificationProgress: React.FC<GamificationProgressProps> = ({
  points = 0,
  level = 1,
  streak = { current: 0, longest: 0 },
  certificatesCount = 0,
  skillsCount = 0,
  verifiedCertificatesCount = 0
}) => {
  const navigate = useNavigate();
  
  // Find current level details
  const currentLevelInfo = levelThresholds.find(l => l.level === level) || levelThresholds[0];
  const nextLevelInfo = levelThresholds.find(l => l.level > level);
  
  // Calculate progress to next level
  const pointsToNextLevel = nextLevelInfo ? nextLevelInfo.points - points : 100;
  const progressPercentage = nextLevelInfo 
    ? Math.round(((points - currentLevelInfo.points) / (nextLevelInfo.points - currentLevelInfo.points)) * 100)
    : 100;
  
  // Determine recommended actions based on user stats
  const recommendedActions = [];
  
  if (certificatesCount < 10) {
    recommendedActions.push({ 
      text: "Add more certificates to earn the Certificate Champion badge", 
      icon: <Award className="h-4 w-4 text-blue-500" />,
      action: () => navigate('/certificates')
    });
  }
  
  if (skillsCount < 10) {
    recommendedActions.push({ 
      text: "Add more skills to earn the Skill Master badge", 
      icon: <Target className="h-4 w-4 text-green-500" />,
      action: () => navigate('/skills')
    });
  }
  
  if (verifiedCertificatesCount < 5) {
    recommendedActions.push({ 
      text: "Verify more certificates to earn the Verification Guru badge", 
      icon: <CheckCircle className="h-4 w-4 text-purple-500" />,
      action: () => navigate('/verification')
    });
  }
  
  if (streak.current < 7) {
    recommendedActions.push({ 
      text: "Login daily to maintain a 7-day streak and earn 50 points", 
      icon: <Flame className="h-4 w-4 text-orange-500" />
    });
  } else if (streak.current < 30) {
    recommendedActions.push({ 
      text: "Keep your login streak going to reach 30 days and earn the Consistency Champion badge", 
      icon: <Flame className="h-4 w-4 text-orange-500" />
    });
  }
  
  // If no specific recommendations, offer a general one
  if (recommendedActions.length === 0) {
    recommendedActions.push({ 
      text: "Complete your profile to earn the Profile Completer badge", 
      icon: <CheckCircle className="h-4 w-4 text-cyan-500" />,
      action: () => navigate('/profile')
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Level {level} • {currentLevelInfo.name}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {pointsToNextLevel} points to Level {level + 1}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/80">
            {points} Total Points
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {level}</span>
              <span>{progressPercentage}%</span>
              <span>Level {level + 1}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Recommended Actions</span>
            </h4>
            
            <div className="space-y-2">
              {recommendedActions.slice(0, 3).map((action, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                  onClick={action.action}
                  role={action.action ? "button" : "none"}
                  style={{ cursor: action.action ? "pointer" : "default" }}
                >
                  {action.icon}
                  <span className="text-sm flex-1">{action.text}</span>
                  {action.action && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
          
          {streak.current > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{streak.current} Day Streak</span>
              </div>
              <Badge variant="outline">Longest: {streak.longest}</Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 border-t pb-2 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/dashboard/achievements')}
        >
          View your full gamification profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GamificationProgress;