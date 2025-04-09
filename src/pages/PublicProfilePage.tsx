import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SkillCard from "@/components/SkillCard";
import { CertificateCard } from "@/components/CertificateCard";
import { CalendarIcon, MapPinIcon, Award, Trophy, Target, Flame, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import apiClient from "@/lib/axios";

interface PublicUserProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  level?: number;
  badges?: any[];
  achievements?: any[];
  learningStreak?: {
    current: number;
    longest: number;
    lastActive: string;
  }
}

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateImage?: string;
  certificateFile?: string;
  fileType?: string;
  skills: string[];
  category: string;
  imageUrl: string;
  isPublic: boolean;
}

const PublicProfilePage = () => {
  const { email } = useParams<{ email: string }>();
  const [profileData, setProfileData] = useState<PublicUserProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch public profile data by email
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching public profile for email: ${email}`);
        
        // Make real API call to get profile by email
        const response = await apiClient.get(`/users/profile/email/${email}`);
        
        if (response.data && response.data.success) {
          const userData = response.data.user;
          console.log(`Found user profile: ${userData.name} (${userData.id})`);
          
          // Map the API response to our interface
          const profileData: PublicUserProfile = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            title: userData.title || '',
            bio: userData.bio || '',
            location: userData.location || '',
            avatarUrl: userData.profileImage || '/placeholder.svg',
            socialLinks: userData.links || {},
            level: userData.gamification?.level || 1,
            badges: userData.gamification?.badges || [],
            achievements: userData.gamification?.achievements || [],
            learningStreak: userData.gamification?.learningStreak || {
              current: 0,
              longest: 0,
              lastActive: new Date().toISOString()
            }
          };
          
          setProfileData(profileData);
          
          // Fetch the user's skills
          try {
            const skillsResponse = await apiClient.get(`/skills/user/${userData.id}`);
            if (skillsResponse.data && skillsResponse.data.success) {
              setSkills(skillsResponse.data.skills.map(skill => ({
                id: skill.id,
                name: skill.name,
                level: skill.points,
                category: skill.category
              })));
            }
          } catch (skillError) {
            console.error('Error fetching user skills:', skillError);
            setSkills([]);
          }
          
          // Fetch the user's certificates
          try {
            console.log(`Fetching certificates for user ID: ${userData.id}`);
            const certificatesResponse = await apiClient.get(`/certificates/user/${userData.id}`);
            if (certificatesResponse.data && certificatesResponse.data.success) {
              console.log('Certificate response:', certificatesResponse.data);
              
              // Filter to only include public certificates and map them
              const allCertificates = certificatesResponse.data.certificates;
              console.log('All certificates from API:', JSON.stringify(allCertificates.map(c => ({ 
                id: c.id || c._id, 
                title: c.title, 
                isPublic: c.isPublic 
              })), null, 2));
              
              const publicCertificates = allCertificates
                .filter(cert => {
                  // Consider a certificate private only if isPublic is explicitly false
                  // Otherwise treat as public (undefined or true)
                  const isPrivate = cert.isPublic === false;
                  if (isPrivate) {
                    console.warn(`Filtering out private certificate: ${cert.id || cert._id} - ${cert.title}`);
                    return false;
                  }
                  return true;
                })
                .map(cert => {
                  // Log raw certificate data for debugging
                  console.log(`Processing certificate ${cert.id || cert._id}:`, cert);
                  
                  return {
                    id: cert.id || cert._id,
                    title: cert.title,
                    issuer: cert.issuer,
                    date: cert.issueDate || cert.date,
                    expiryDate: cert.expiryDate,
                    credentialId: cert.credentialID || cert.credentialId || '',
                    credentialUrl: cert.credentialURL || cert.credentialUrl || '',
                    certificateImage: cert.certificateImage || '',
                    certificateFile: cert.certificateFile || '',
                    fileType: cert.fileType || 'none',
                    skills: Array.isArray(cert.skills) 
                      ? cert.skills.map(s => typeof s === 'object' ? (s.name || '') : s)
                      : [],
                    category: (Array.isArray(cert.skills) && cert.skills[0]?.category) 
                      ? cert.skills[0].category 
                      : (cert.category || 'General'),
                    imageUrl: cert.certificateImage || '/placeholder.svg',
                    isPublic: true
                  };
                });
              
              console.log(`Displaying ${publicCertificates.length} public certificates out of ${certificatesResponse.data.certificates.length} total`);
              setCertificates(publicCertificates);
            }
          } catch (certError) {
            console.error('Error fetching user certificates:', certError);
            setCertificates([]);
          }
        } else {
          console.error('Failed to get profile data');
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (email) {
      fetchProfileData();
    }
  }, [email]);

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="flex items-center justify-center h-[80vh]">Profile not found</div>;
  }

  const achievementIconMap = {
    'certificate_milestone': <Award className="h-4 w-4 text-blue-500" />,
    'skill_level_up': <Target className="h-4 w-4 text-green-500" />,
    'perfect_verification': <Star className="h-4 w-4 text-purple-500" />,
    'learning_streak': <Flame className="h-4 w-4 text-orange-500" />,
    'top_learner': <Trophy className="h-4 w-4 text-yellow-500" />
  };

  const badgeIconMap = {
    'skill-master': <Target className="h-6 w-6 text-blue-500" />,
    'certificate-champion': <Award className="h-6 w-6 text-purple-500" />,
    'verification-guru': <Star className="h-6 w-6 text-green-500" />,
    'consistency-king': <Flame className="h-6 w-6 text-orange-500" />,
    'profile-complete': <Star className="h-6 w-6 text-cyan-500" />,
    'top-learner': <Trophy className="h-6 w-6 text-yellow-500" />,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="profile-card">
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profileData.avatarUrl} />
                <AvatarFallback>{profileData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profileData.name}</CardTitle>
              <p className="text-muted-foreground">{profileData.title || "No title set"}</p>
              
              {profileData.level && (
                <div className="mt-2">
                  <Badge variant="outline">
                    Level {profileData.level}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {profileData.location}
                </div>
              )}
              
              {profileData.bio && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                </div>
              )}
              
              {/* Learning Streak Section */}
              {profileData.learningStreak && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Flame className="h-4 w-4 text-orange-500 mr-1" />
                    Learning Streak
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{profileData.learningStreak.current} Days</div>
                        <div className="text-xs text-muted-foreground">Current Streak</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-sm font-medium">{profileData.learningStreak.longest} Days</div>
                        <div className="text-xs text-muted-foreground">Longest Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {profileData.socialLinks && Object.values(profileData.socialLinks).some(link => link) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Connect</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.socialLinks.linkedin && (
                      <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        LinkedIn
                      </a>
                    )}
                    {profileData.socialLinks.github && (
                      <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-200 hover:underline text-sm">
                        GitHub
                      </a>
                    )}
                    {profileData.socialLinks.twitter && (
                      <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                        Twitter
                      </a>
                    )}
                    {profileData.socialLinks.website && (
                      <a href={profileData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Badges Card */}
          {profileData.badges && profileData.badges.length > 0 && (
            <Card className="profile-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 justify-center">
                  {profileData.badges.map((badge, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {badge.image ? (
                          <img src={badge.image} alt={badge.name} className="w-10 h-10" />
                        ) : (
                          badgeIconMap[badge.type] || <Award className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-center mt-1">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-3 space-y-6">
          {/* Achievements Section */}
          {profileData.achievements && profileData.achievements.length > 0 && (
            <Card className="profile-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Recent accomplishments and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profileData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border">
                      <div className="mt-0.5">
                        {achievementIconMap[achievement.type] || <Star className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{achievement.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        
          <Card className="profile-card">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <div key={skill.id} className="w-full">
                      <SkillCard 
                        skill={skill}
                        readOnly
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full">No skills added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="profile-card">
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.length > 0 ? (
                  certificates.map((certificate) => (
                    <div key={certificate.id} className="w-full">
                      <CertificateCard certificate={certificate} readOnly />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-muted-foreground/50 mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" 
                        />
                      </svg>
                      <h3 className="text-base font-medium mb-2">No Certificates Available</h3>
                      <p className="text-muted-foreground">
                        This user hasn't added any certificates to their profile yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
