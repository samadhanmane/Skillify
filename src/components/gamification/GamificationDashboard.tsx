import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrophyIcon, 
  MedalIcon, 
  AwardIcon, 
  UsersIcon, 
  StarIcon,
  CheckCircleIcon,
  LockIcon,
  TrendingUpIcon,
  BookOpenIcon,
  ScanIcon
} from 'lucide-react';

const GamificationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [gamificationData, setGamificationData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/gamification/dashboard');
        if (data.success) {
          setGamificationData(data.gamificationData);
        } else {
          setError(data.message || 'Failed to fetch gamification data');
        }
      } catch (err) {
        setError('Error loading gamification data. Please try again.');
        console.error('Error fetching gamification data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, []);

  const acceptChallenge = async (challengeId) => {
    try {
      const { data } = await axios.post(`/api/gamification/challenges/${challengeId}/accept`);
      if (data.success) {
        // Update local state with the accepted challenge
        setGamificationData(prevState => {
          const updatedChallenges = prevState.challenges.map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, status: 'in-progress' } 
              : challenge
          );
          return { ...prevState, challenges: updatedChallenges };
        });
      } else {
        setError(data.message || 'Failed to accept challenge');
      }
    } catch (err) {
      setError('Error accepting challenge. Please try again.');
      console.error('Error accepting challenge:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!gamificationData) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No gamification data available. Start adding certificates and skills to see your progress!
        </AlertDescription>
      </Alert>
    );
  }

  const { level, points, nextLevelPoints, achievements, badges, leaderboard, challenges, streakData } = gamificationData;
  const progressPercentage = (points / nextLevelPoints) * 100;

  const badgeIconMap = {
    'skill-master': <BookOpenIcon className="h-8 w-8" />,
    'certificate-champion': <AwardIcon className="h-8 w-8" />,
    'verification-guru': <ScanIcon className="h-8 w-8" />,
    'consistency-king': <TrendingUpIcon className="h-8 w-8" />,
    'profile-complete': <CheckCircleIcon className="h-8 w-8" />
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Level Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold">Level {level}</div>
              <TrophyIcon className="h-8 w-8 text-amber-500" />
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {points} / {nextLevelPoints} points to Level {level + 1}
            </p>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{streakData.currentStreak} days</div>
              <MedalIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Best streak: {streakData.longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* Ranks Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">#{leaderboard.userRank}</div>
              <UsersIcon className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Top {Math.round((leaderboard.userRank / leaderboard.totalUsers) * 100)}% of all users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="badges">
        <TabsList className="mb-4">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {badges.map((badge) => (
              <Card key={badge.id} className={`overflow-hidden ${!badge.unlocked ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">{badge.name}</CardTitle>
                  <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                    {badgeIconMap[badge.type] || <AwardIcon className="h-5 w-5" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                </CardContent>
                <CardFooter className="pt-0 pb-2">
                  <div className="w-full flex justify-between items-center">
                    <Badge variant={badge.unlocked ? "default" : "outline"}>
                      {badge.unlocked ? 'Unlocked' : 'Locked'}
                    </Badge>
                    <span className="text-xs font-medium">{badge.tier || 'Basic'}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={`${!achievement.completed ? 'opacity-80' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">{achievement.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Badge variant={achievement.completed ? "default" : "outline"}>
                        {achievement.completed ? 'Completed' : `${achievement.progress}/${achievement.goal}`}
                      </Badge>
                      {achievement.pointsAwarded && achievement.completed && (
                        <Badge variant="secondary">{achievement.pointsAwarded} pts</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(achievement.progress / achievement.goal) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {achievement.completed 
                      ? `Completed on ${new Date(achievement.completedAt).toLocaleDateString()}`
                      : `Progress: ${achievement.progress} of ${achievement.goal} ${achievement.unit || 'steps'}`
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Available Challenges</h3>
              {challenges.map((challenge) => (
                <Card 
                  key={challenge.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedChallenge?.id === challenge.id ? 'ring-2 ring-primary' : ''
                  } ${challenge.status === 'completed' ? 'opacity-70' : ''}`}
                  onClick={() => setSelectedChallenge(challenge)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">{challenge.name}</CardTitle>
                      <Badge variant={
                        challenge.status === 'available' ? "outline" : 
                        challenge.status === 'in-progress' ? "default" : 
                        "secondary"
                      }>
                        {challenge.status === 'available' ? 'Available' : 
                         challenge.status === 'in-progress' ? 'In Progress' : 
                         'Completed'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div className="flex-1">
                        <StarIcon className="inline h-3 w-3 mr-1" />
                        {challenge.difficulty}
                      </div>
                      <div>
                        <TrophyIcon className="inline h-3 w-3 mr-1" />
                        {challenge.pointsReward} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Challenge Details</h3>
              {selectedChallenge ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{selectedChallenge.name}</CardTitle>
                      <Badge variant={
                        selectedChallenge.status === 'available' ? "outline" : 
                        selectedChallenge.status === 'in-progress' ? "default" : 
                        "secondary"
                      }>
                        {selectedChallenge.status === 'available' ? 'Available' : 
                         selectedChallenge.status === 'in-progress' ? 'In Progress' : 
                         'Completed'}
                      </Badge>
                    </div>
                    <CardDescription>{selectedChallenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Objectives</h4>
                      <ul className="space-y-2">
                        {selectedChallenge.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start">
                            {objective.completed ? (
                              <CheckCircleIcon className="h-4 w-4 mt-0.5 mr-2 text-green-500 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 mt-0.5 mr-2 rounded-full border border-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm">
                              {objective.description}
                              {objective.progress !== undefined && (
                                <span className="text-muted-foreground"> - {objective.progress}/{objective.goal}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Rewards</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded-md p-2 flex items-center">
                          <TrophyIcon className="h-4 w-4 mr-2 text-amber-500" />
                          <div>
                            <div className="text-sm font-medium">{selectedChallenge.pointsReward} Points</div>
                            <div className="text-xs text-muted-foreground">Experience points</div>
                          </div>
                        </div>
                        {selectedChallenge.badgeReward && (
                          <div className="border rounded-md p-2 flex items-center">
                            <AwardIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium">{selectedChallenge.badgeReward.name}</div>
                              <div className="text-xs text-muted-foreground">Special badge</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedChallenge.status === 'available' && (
                      <Button 
                        className="w-full" 
                        onClick={() => acceptChallenge(selectedChallenge.id)}
                      >
                        Accept Challenge
                      </Button>
                    )}

                    {selectedChallenge.status === 'in-progress' && (
                      <div>
                        <Separator className="my-2" />
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Progress</h4>
                          <Progress 
                            value={
                              (selectedChallenge.objectives.filter(o => o.completed).length / 
                              selectedChallenge.objectives.length) * 100
                            } 
                            className="h-2 mt-2" 
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {selectedChallenge.objectives.filter(o => o.completed).length} of {selectedChallenge.objectives.length} objectives completed
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedChallenge.status === 'completed' && (
                      <div className="border rounded-md p-3 bg-primary/5">
                        <h4 className="text-sm font-medium mb-1 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                          Challenge Completed!
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Completed on {new Date(selectedChallenge.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 flex flex-col items-center justify-center h-80">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <TrophyIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      Select a challenge from the list to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Top users based on points and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {leaderboard.topUsers.map((user, index) => (
                    <div 
                      key={user.id} 
                      className={`flex items-center justify-between p-3 rounded-md ${
                        user.isCurrentUser ? 'bg-primary/10 font-medium' : index % 2 === 0 ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 text-center font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-4 flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden mr-3"
                          >
                            {user.profileImage ? (
                              <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs">{user.username.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>{user.username}</div>
                          {index < 3 && (
                            <div className="ml-2">
                              {index === 0 && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                              {index === 1 && <MedalIcon className="h-4 w-4 text-gray-400" />}
                              {index === 2 && <MedalIcon className="h-4 w-4 text-amber-700" />}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right">
                          <div>{user.points} pts</div>
                          <div className="text-xs text-muted-foreground">Level {user.level}</div>
                        </div>
                        <div className="ml-4 flex">
                          {user.badges.slice(0, 3).map((badge, bidx) => (
                            <div key={bidx} className="w-6 h-6 -ml-1 first:ml-0">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {badgeIconMap[badge.type] ? (
                                  React.cloneElement(badgeIconMap[badge.type], { className: 'h-4 w-4' })
                                ) : (
                                  <AwardIcon className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          ))}
                          {user.badges.length > 3 && (
                            <div className="w-6 h-6 -ml-1 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs">+{user.badges.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard; 