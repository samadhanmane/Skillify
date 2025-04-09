import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import SkillRadarChart from "@/components/SkillRadarChart";
import SkillCategoryChart from "@/components/SkillCategoryChart";
import { CertificateCard } from "@/components/CertificateCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Award, BarChart, GraduationCap, Trophy, Target, Flame, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import GamificationProgress from "@/components/gamification/GamificationProgress";
import axios from "axios";

const DashboardPage: React.FC = () => {
  const { skills, certificates } = useAppContext();
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        // Fetch user's gamification data
        const { data } = await axios.get('/api/gamification/profile');
        if (data.success) {
          setGamificationData(data.gamificationData);
        }
      } catch (error) {
        console.error('Error fetching gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, []);

  const totalSkills = skills.length;
  const totalCertificates = certificates.length;
  const avgSkillLevel = Math.round(
    skills.length > 0 
      ? skills.reduce((acc, skill) => acc + skill.level, 0) / skills.length
      : 0
  );

  // Get latest certificates
  const latestCertificates = [...certificates]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your skills and certifications.
        </p>
      </div>

      {/* Enhanced gamification card with guidance */}
      {gamificationData && (
        <div className="grid gap-6 md:grid-cols-2">
          <GamificationProgress 
            points={gamificationData.points} 
            level={gamificationData.level}
            streak={gamificationData.learningStreak}
            certificatesCount={gamificationData.stats?.totalCertificates}
            verifiedCertificatesCount={gamificationData.stats?.verifiedCertificates}
            skillsCount={gamificationData.stats?.skillsCount}
          />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSkills}</div>
                <p className="text-xs text-muted-foreground">
                  Skills tracked across categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Skill Level</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSkillLevel || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Overall proficiency level
                </p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCertificates}</div>
                <p className="text-xs text-muted-foreground">
                  Certifications earned
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillCategoryChart skills={skills} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skill Proficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillRadarChart skills={skills} />
          </CardContent>
        </Card>
      </div>

      {/* Latest Certificates Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Latest Certificates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latestCertificates.length > 0 ? (
            latestCertificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))
          ) : (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Award className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>You haven't added any certificates yet.</p>
                  <p className="text-sm text-muted-foreground">Add certificates to earn points and badges!</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Badges Section - Conditionally show if user has badges */}
      {gamificationData && gamificationData.badges && gamificationData.badges.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Your Badges</h2>
            <Link to="/dashboard/achievements">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            {gamificationData.badges.slice(0, 6).map((badge, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                  {badge.image ? (
                    <img src={badge.image} alt={badge.name} className="w-12 h-12" />
                  ) : (
                    <Award className="h-8 w-8 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium text-center">{badge.name}</span>
              </div>
            ))}
            {gamificationData.badges.length > 6 && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2 opacity-70">
                  <span className="text-lg font-bold">+{gamificationData.badges.length - 6}</span>
                </div>
                <span className="text-sm text-muted-foreground">More badges</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
