import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import UserBadges from '@/components/gamification/UserBadges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trophy, Award, Target, Flame, Medal, Star, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';

interface LeaderboardUser {
  rank: number;
  _id: string;
  name: string;
  profileImage: string;
  title: string;
  points: number;
  level: number;
  badgeCount: number;
  currentStreak: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  userRank: number | null;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const achievementCategories = [
  { id: 'all', name: 'All Achievements' },
  { id: 'certificate_milestone', name: 'Certificate Milestones' },
  { id: 'skill_level_up', name: 'Skill Level-ups' },
  { id: 'perfect_verification', name: 'Perfect Verification' },
  { id: 'learning_streak', name: 'Learning Streak' },
  { id: 'top_learner', name: 'Top Learner' },
];

const AchievementsPage: React.FC = () => {
  const { gamification, userProfile, certificates, skills, refreshData, loading, updateStreak } = useAppContext();
  const [activeTab, setActiveTab] = useState('badges');
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [category, setCategory] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(1);

  useEffect(() => {
    if (gamification) {
      if (category === 'all') {
        setFilteredAchievements(gamification.achievements);
      } else {
        setFilteredAchievements(
          gamification.achievements.filter(achievement => achievement.type === category)
        );
      }
    }
  }, [gamification, category]);

  useEffect(() => {
    // Fetch leaderboard data when the tab changes to leaderboard
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, leaderboardPage]);

  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const response = await apiClient.get(`/gamification/enhanced-leaderboard?page=${leaderboardPage}&limit=10`);
      if (response.data.success) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Update streak and refresh gamification data
    await updateStreak();
    await refreshData();
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
    toast.success('Gamification data refreshed!');
  };

  const handleNextPage = () => {
    if (leaderboardData && leaderboardPage < leaderboardData.pagination.pages) {
      setLeaderboardPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (leaderboardPage > 1) {
      setLeaderboardPage(prev => prev - 1);
    }
  };

  return (
    <div className="container py-6 space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Achievements & Badges</h1>
        <p className="text-muted-foreground">
          Track your progress and earn rewards for your learning journey
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading.gamification || leaderboardLoading}
          className="ml-auto flex items-center gap-1"
        >
          {loading.gamification || leaderboardLoading ? 'Refreshing...' : 'Refresh Stats'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Badges</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            <span>Leaderboard</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              {gamification ? (
                <UserBadges 
                  badges={gamification.badges || []} 
                  achievements={gamification.achievements || []} 
                  level={gamification.level || 1} 
                  points={gamification.points || 0}
                  learningStreak={gamification.learningStreak}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center">Loading gamification data...</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Certificates</p>
                      <p className="text-xl font-bold">{gamification?.stats?.totalCertificates || certificates.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Verified Certificates</p>
                      <p className="text-xl font-bold">{gamification?.stats?.verifiedCertificates || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Skills</p>
                      <p className="text-xl font-bold">{gamification?.stats?.skillsCount || skills.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Avg. Skill Level</p>
                      <p className="text-xl font-bold">{gamification?.stats?.avgSkillLevel || 0}%</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <p className="text-xl font-bold">{gamification?.learningStreak?.current || 0} days</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Login daily to maintain your streak!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="space-y-1">
                    {achievementCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={category === cat.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setCategory(cat.id)}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement History</CardTitle>
                  <CardDescription>
                    All your achievements in chronological order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.gamification ? (
                    <p className="text-center py-8">Loading achievements...</p>
                  ) : filteredAchievements && filteredAchievements.length > 0 ? (
                    <div className="space-y-4">
                      {filteredAchievements.map((achievement, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                          <div className="mt-1">
                            {achievement.type === 'certificate_milestone' && <Award className="h-5 w-5 text-blue-500" />}
                            {achievement.type === 'skill_level_up' && <Target className="h-5 w-5 text-green-500" />}
                            {achievement.type === 'perfect_verification' && <Medal className="h-5 w-5 text-purple-500" />}
                            {achievement.type === 'learning_streak' && <Flame className="h-5 w-5 text-orange-500" />}
                            {achievement.type === 'top_learner' && <Star className="h-5 w-5 text-yellow-500" />}
                            {achievement.type === 'level_up' && <Trophy className="h-5 w-5 text-amber-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{achievement.details}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(achievement.earnedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="mb-3">No achievements found in this category</p>
                      <p className="text-sm text-muted-foreground">
                        Continue using the platform to earn achievements!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Top users based on points and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="text-center py-8">
                  <p>Loading leaderboard data...</p>
                </div>
              ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                <div className="space-y-6">
                  {/* User's rank if available */}
                  {leaderboardData.userRank && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-center text-muted-foreground mb-1">Your Current Rank</p>
                      <p className="text-xl font-bold text-center">{leaderboardData.userRank}</p>
                    </div>
                  )}
                  
                  {/* Leaderboard table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-2 text-left w-16">Rank</th>
                          <th className="py-3 px-2 text-left">User</th>
                          <th className="py-3 px-2 text-right">Points</th>
                          <th className="py-3 px-2 text-right">Level</th>
                          <th className="py-3 px-2 text-right">Badges</th>
                          <th className="py-3 px-2 text-right">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardData.leaderboard.map((user) => (
                          <tr 
                            key={user._id} 
                            className={`border-b hover:bg-muted/30 ${user._id === userProfile.id ? 'bg-primary/5' : ''}`}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                {user.rank <= 3 ? (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                    {user.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
                                    {user.rank === 2 && <Crown className="h-5 w-5 text-slate-400" />}
                                    {user.rank === 3 && <Crown className="h-5 w-5 text-amber-700" />}
                                  </div>
                                ) : (
                                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {user.rank}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.profileImage} alt={user.name} />
                                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  {user.title && <p className="text-xs text-muted-foreground">{user.title}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-medium">{user.points}</td>
                            <td className="py-3 px-2 text-right">
                              <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2 text-xs font-medium">
                                {user.level}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">{user.badgeCount}</td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>{user.currentStreak}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {leaderboardData.pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePrevPage}
                        disabled={leaderboardPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {leaderboardPage} of {leaderboardData.pagination.pages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleNextPage}
                        disabled={leaderboardPage === leaderboardData.pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-3">No leaderboard data available</p>
                  <p className="text-sm text-muted-foreground">
                    Start earning points to appear on the leaderboard!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage; 