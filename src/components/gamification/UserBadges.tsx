import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Trophy, Target, Flame, BookOpen, CheckCircle, Medal, Star, Info, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface BadgeType {
  name: string;
  description: string;
  image?: string;
  earnedAt: string;
  type?: string;
}

interface AchievementType {
  type: string;
  details: string;
  earnedAt: string;
}

interface UserBadgesProps {
  badges: BadgeType[];
  achievements: AchievementType[];
  level: number;
  points: number;
  learningStreak?: {
    current: number;
    longest: number;
    lastActive: string;
  };
}

// Define level badges with requirements and images
const levelBadges = [
  { level: 1, name: "Beginner", description: "Just starting your learning journey", icon: <Trophy className="h-6 w-6 text-gray-500" /> },
  { level: 2, name: "Explorer", description: "Exploring new skills and collecting certificates", icon: <Trophy className="h-6 w-6 text-blue-400" /> },
  { level: 5, name: "Achiever", description: "Building a solid skills foundation", icon: <Trophy className="h-6 w-6 text-green-500" /> },
  { level: 10, name: "Expert", description: "Mastering your skills and sharing knowledge", icon: <Trophy className="h-6 w-6 text-purple-500" /> },
  { level: 20, name: "Master", description: "A recognized authority in your field", icon: <Trophy className="h-6 w-6 text-yellow-500" /> },
  { level: 30, name: "Legend", description: "Your expertise is legendary", icon: <Trophy className="h-6 w-6 text-amber-600" /> },
];

const badgeIconMap = {
  'skill-master': <BookOpen className="h-6 w-6 text-blue-500" />,
  'certificate-champion': <Award className="h-6 w-6 text-purple-500" />,
  'verification-guru': <CheckCircle className="h-6 w-6 text-green-500" />,
  'consistency-king': <Flame className="h-6 w-6 text-orange-500" />,
  'profile-complete': <CheckCircle className="h-6 w-6 text-cyan-500" />,
  'top-learner': <Star className="h-6 w-6 text-yellow-500" />,
  'perfect-verification': <Medal className="h-6 w-6 text-amber-500" />,
};

const achievementIconMap = {
  'certificate_milestone': <Award className="h-4 w-4 text-blue-500" />,
  'skill_level_up': <Target className="h-4 w-4 text-green-500" />,
  'perfect_verification': <CheckCircle className="h-4 w-4 text-purple-500" />,
  'learning_streak': <Flame className="h-4 w-4 text-orange-500" />,
  'top_learner': <Star className="h-4 w-4 text-yellow-500" />,
};

// Specific badge requirements for guidance
const badgeRequirements = [
  {
    type: 'skill-master',
    name: 'Skill Master',
    description: 'Add 10 or more skills to your profile',
    icon: badgeIconMap['skill-master'],
    howToEarn: 'Keep adding skills you have learned from courses, tutorials, or personal experience. Make sure to rate your proficiency level accurately.'
  },
  {
    type: 'certificate-champion',
    name: 'Certificate Champion',
    description: 'Add 10 or more certificates to your profile',
    icon: badgeIconMap['certificate-champion'],
    howToEarn: 'Add all your certificates from online platforms, schools, or any professional certifications you\'ve earned.'
  },
  {
    type: 'verification-guru',
    name: 'Verification Guru',
    description: 'Have 5 or more verified certificates',
    icon: badgeIconMap['verification-guru'],
    howToEarn: 'Verify your certificates through our verification system. Upload certificates with valid credentials that can be verified.'
  },
  {
    type: 'consistency-king',
    name: 'Consistency Champion',
    description: 'Maintain a 30-day learning streak',
    icon: badgeIconMap['consistency-king'],
    howToEarn: 'Log into your account daily to maintain your streak. Review your skills and certificates regularly.'
  },
  {
    type: 'profile-complete',
    name: 'Profile Completer',
    description: 'Fill out all profile details including bio, location, and social links',
    icon: badgeIconMap['profile-complete'],
    howToEarn: 'Update your profile with a comprehensive bio, your current location, and connect your social media accounts.'
  },
  {
    type: 'perfect-verification',
    name: 'Perfect Verification',
    description: 'Achieve 100% verification score on a certificate',
    icon: badgeIconMap['perfect-verification'],
    howToEarn: 'Submit high-quality certificate images with clear text and proper formatting for a perfect verification score.'
  }
];

// Points earning opportunities
const pointsOpportunities = [
  { activity: "Daily login", points: "5 points", icon: <Flame className="h-4 w-4 text-orange-500" /> },
  { activity: "Adding a new certificate", points: "20 points", icon: <Award className="h-4 w-4 text-blue-500" /> },
  { activity: "Verifying a certificate", points: "30 points", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { activity: "Adding a new skill", points: "15 points", icon: <Target className="h-4 w-4 text-purple-500" /> },
  { activity: "Completing your profile", points: "25 points", icon: <CheckCircle className="h-4 w-4 text-cyan-500" /> },
  { activity: "7-day streak", points: "50 points", icon: <Flame className="h-4 w-4 text-orange-500" /> },
  { activity: "30-day streak", points: "200 points", icon: <Flame className="h-4 w-4 text-orange-500" /> }
];

const UserBadges: React.FC<UserBadgesProps> = ({ 
  badges = [], 
  achievements = [], 
  level = 1, 
  points = 0,
  learningStreak 
}) => {
  const [showEarningGuide, setShowEarningGuide] = useState(false);
  
  // Calculate points to next level (every 100 points)
  const pointsToNextLevel = 100 - (points % 100);
  const progressPercentage = (points % 100);
  
  // Get current level badge
  const currentLevelBadge = levelBadges.filter(badge => badge.level <= level).pop();
  const nextLevelBadge = levelBadges.find(badge => badge.level > level);

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">Level {level}</div>
              {currentLevelBadge && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{currentLevelBadge.icon}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{currentLevelBadge.name}</p>
                      <p className="text-xs">{currentLevelBadge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Badge variant="outline">{points} points</Badge>
          </div>
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <p>
                {pointsToNextLevel} points to Level {level + 1}
              </p>
              {nextLevelBadge && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <HelpCircle className="h-3 w-3" />
                        <span>Next rank</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Level {nextLevelBadge.level}: {nextLevelBadge.name}</p>
                      <p className="text-xs">{nextLevelBadge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Your Badges
          </CardTitle>
          <CardDescription>
            Showcase your achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {badges && badges.length > 0 ? (
              badges.map((badge, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          {badge.image ? (
                            <img src={badge.image} alt={badge.name} className="w-10 h-10" />
                          ) : (
                            badgeIconMap[badge.type] || <Award className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs">{badge.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Earned on {new Date(badge.earnedAt).toLocaleDateString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Complete activities to earn badges</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowEarningGuide(!showEarningGuide)}
            className="w-full flex items-center gap-1 text-sm justify-center"
          >
            <Info className="h-4 w-4" />
            <span>How to earn more badges</span>
            {showEarningGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

      {/* Badge Earning Guide - conditionally shown */}
      {showEarningGuide && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              Badge Earning Guide
            </CardTitle>
            <CardDescription>
              Here's how you can earn more badges and points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="badges">
                <AccordionTrigger className="text-sm font-medium">Available Badges</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {badgeRequirements.map((badge, index) => {
                      const earned = badges.some(b => b.name === badge.name);
                      return (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-md ${earned ? 'bg-primary/10' : 'bg-muted/40'}`}>
                          <div className="mt-0.5">
                            {badge.icon}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{badge.name}</p>
                              {earned && <Badge>Earned</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                            <p className="text-xs border-l-2 border-primary/30 pl-2 italic">{badge.howToEarn}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="points">
                <AccordionTrigger className="text-sm font-medium">Ways to Earn Points</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {pointsOpportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
                        <div>{opportunity.icon}</div>
                        <div className="flex-1 text-sm">{opportunity.activity}</div>
                        <div className="text-sm font-medium">{opportunity.points}</div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="levels">
                <AccordionTrigger className="text-sm font-medium">Level Progression</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {levelBadges.map((badge, index) => (
                      <div key={index} className={`flex items-center gap-3 p-2 rounded-md ${level >= badge.level ? 'bg-primary/10' : 'bg-muted/40 opacity-80'}`}>
                        <div>{badge.icon}</div>
                        <div>
                          <p className="text-sm font-medium">Level {badge.level}: {badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </div>
                        {level >= badge.level && (
                          <div className="ml-auto">
                            <Badge variant="outline">Unlocked</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Learning Streak Card (conditionally rendered) */}
      {learningStreak && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold">{learningStreak.current} days</div>
              <Badge variant="outline">Longest: {learningStreak.longest} days</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep learning daily to maintain your streak!
            </p>
            
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                <span>Login daily to increase your streak and earn badges</span>
              </p>
              <div className="flex justify-between items-center mt-1">
                <span>7 days: +50 points</span>
                <span>30 days: +200 points & special badge</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserBadges; 