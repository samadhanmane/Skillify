import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDaysIcon, CheckCircleIcon, MedalIcon, ClockIcon } from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import SkillCategoryChart from '@/components/SkillCategoryChart';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/analytics/dashboard');
        if (data.success) {
          setDashboardData(data.dashboardData);
        } else {
          setError(data.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        setError('Error loading analytics data. Please try again.');
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function to format data for pie chart
  const formatCategoryData = (skillDistribution) => {
    if (!skillDistribution) return [];
    
    return Object.entries(skillDistribution).map(([name, value]) => ({
      name,
      value: Number(value)
    }));
  };

  // Function to format data for bar chart
  const formatCertificateData = (certificateStats) => {
    if (!certificateStats || !certificateStats.byIssuer) return [];
    
    return Object.entries(certificateStats.byIssuer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count: Number(count)
      }));
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
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

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No analytics data available. Start adding certificates and skills to see your insights!
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, skillDistribution, certificateStats, learningPatterns, topRecommendations } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{summary.totalCertificates}</div>
              <MedalIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.verifiedCertificates} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{summary.skillsCount}</div>
              <CheckCircleIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. Level: {summary.avgSkillLevel.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gamification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Level {summary.level}</div>
              <CalendarDaysIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.points} points - {summary.streak} day streak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Learning Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold capitalize">{learningPatterns.learningPace}</div>
              <ClockIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consistency: {learningPatterns.consistencyScore}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certificates">
        <TabsList className="mb-4">
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Distribution by Issuer</CardTitle>
                <CardDescription>Your top certificate providers</CardDescription>
              </CardHeader>
              <CardContent>
                {certificateStats.totalCount > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatCertificateData(certificateStats)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No certificate data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Distribution of verified, pending, and rejected certificates</CardDescription>
              </CardHeader>
              <CardContent>
                {certificateStats.totalCount > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Verified', value: certificateStats.verifiedCount },
                            { name: 'Pending', value: certificateStats.pendingCount },
                            { name: 'Rejected', value: certificateStats.rejectedCount }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Verified', value: certificateStats.verifiedCount, color: '#4ade80' },
                            { name: 'Pending', value: certificateStats.pendingCount, color: '#facc15' },
                            { name: 'Rejected', value: certificateStats.rejectedCount, color: '#f87171' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No certificate data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skill Distribution by Category</CardTitle>
                <CardDescription>Breakdown of your skills by category</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(skillDistribution).length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatCategoryData(skillDistribution)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatCategoryData(skillDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No skill data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Focus Areas</CardTitle>
                <CardDescription>Your top skill focus areas</CardDescription>
              </CardHeader>
              <CardContent>
                {learningPatterns.focusAreas && learningPatterns.focusAreas.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      {learningPatterns.focusAreas.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="font-medium">{skill}</div>
                          <Badge variant={index < 2 ? "default" : "outline"}>
                            {index === 0 ? "Primary" : index === 1 ? "Secondary" : "Focus"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Preferred Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {learningPatterns.preferredCategories.map((category, index) => (
                          <Badge key={index} variant="secondary">{category}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No focus areas data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Personalized recommendations based on your learning patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {topRecommendations && topRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {topRecommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{rec.name}</div>
                          <Badge variant={rec.type === 'skill' ? "default" : rec.type === 'course' ? "secondary" : "outline"}>
                            {rec.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-muted-foreground">No recommendations available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Pattern Analysis</CardTitle>
                <CardDescription>Insights from your learning history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Pace</h4>
                    <p className="text-sm text-muted-foreground capitalize">{learningPatterns.learningPace} learning pace</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Consistency</h4>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${learningPatterns.consistencyScore}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {learningPatterns.consistencyScore < 30 
                        ? "Your learning could benefit from more consistency" 
                        : learningPatterns.consistencyScore < 70 
                          ? "You have a moderately consistent learning pattern" 
                          : "You maintain a highly consistent learning schedule"
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Badges and Streaks</h4>
                    <p className="text-sm text-muted-foreground">
                      Level {summary.level} with {summary.points} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current streak: {summary.streak} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard; 