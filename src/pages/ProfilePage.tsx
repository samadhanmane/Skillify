import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CheckIcon, CopyIcon, ShareIcon, QrCode, Download } from "lucide-react";
import UserBadges from "@/components/gamification/UserBadges";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import apiClient from "@/lib/axios";
import QRCode from "react-qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EducationSection from "@/components/EducationSection";
import ResumeGeneratorDialog from "@/components/ResumeGeneratorDialog";

const ProfilePage = () => {
  const { userProfile, updateUserProfile } = useAppContext();
  const [formData, setFormData] = useState({
    name: userProfile.name || "",
    email: userProfile.email || "",
    title: userProfile.title || "",
    bio: userProfile.bio || "",
    location: userProfile.location || "",
    linkedinUrl: userProfile.socialLinks?.linkedin || "",
    githubUrl: userProfile.socialLinks?.github || "",
    twitterUrl: userProfile.socialLinks?.twitter || "",
    websiteUrl: userProfile.socialLinks?.website || "",
  });
  const [copied, setCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [gamificationData, setGamificationData] = useState({
    points: 0,
    level: 1,
    badges: [],
    achievements: [],
    learningStreak: {
      current: 0,
      longest: 0,
      lastActive: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shareableLink = `${window.location.origin}/profile/${userProfile.email}`;

  // Reset form data when userProfile changes
  useEffect(() => {
    setFormData({
      name: userProfile.name || "",
      email: userProfile.email || "",
      title: userProfile.title || "",
      bio: userProfile.bio || "",
      location: userProfile.location || "",
      linkedinUrl: userProfile.socialLinks?.linkedin || "",
      githubUrl: userProfile.socialLinks?.github || "",
      twitterUrl: userProfile.socialLinks?.twitter || "",
      websiteUrl: userProfile.socialLinks?.website || "",
    });
  }, [userProfile]);

  // Fetch gamification data when component mounts
  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        // Update user streak first (counts as daily login)
        await apiClient.post('/gamification/update-streak');
        
        // Then fetch user's gamification data
        const { data } = await apiClient.get('/gamification/profile');
        if (data.success) {
          setGamificationData(data.gamificationData);
        }
      } catch (error) {
        console.error('Error fetching gamification data:', error);
        // Don't show error toast to user - just use default data
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, []);

  // Fetch QR code when dialog opens
  useEffect(() => {
    const fetchQRCode = async () => {
      if (shareDialogOpen && !qrCodeUrl) {
        try {
          const { data } = await apiClient.get('/users/qrcode');
          if (data.success && data.qrCodeUrl) {
            setQrCodeUrl(data.qrCodeUrl);
          }
        } catch (error) {
          console.error('Error fetching QR code:', error);
        }
      }
    };

    fetchQRCode();
  }, [shareDialogOpen, qrCodeUrl]);

  // Check if email is already in use
  const checkEmailUniqueness = async (email: string) => {
    // Skip check if email hasn't changed
    if (email === userProfile.email) {
      setEmailError("");
      return true;
    }
    
    try {
      setIsCheckingEmail(true);
      const { data } = await apiClient.post('/auth/check-email', { email });
      if (data.exists) {
        setEmailError("This email is already in use");
        return false;
      } else {
        setEmailError("");
        return true;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailError("Could not verify email uniqueness");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle email change with debounce
  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Wait 500ms after typing stops before checking
    if (name === 'email') {
      setIsCheckingEmail(true);
      // Simple email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError("Please enter a valid email address");
        setIsCheckingEmail(false);
        return;
      }
      
      // Debounce the API call
      const timeoutId = setTimeout(() => {
        checkEmailUniqueness(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      handleEmailChange(e as React.ChangeEvent<HTMLInputElement>);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Create a new dedicated save function
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Check email uniqueness before submitting
      if (formData.email !== userProfile.email) {
        const isUnique = await checkEmailUniqueness(formData.email);
        if (!isUnique) {
          toast.error("Please fix the email error before saving");
          return;
        }
      }
      
      // Verify all required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        toast.error("Name and email are required");
        return;
      }
      
      // If email was changed, update auth credentials too
      if (formData.email !== userProfile.email) {
        // Update email in auth system
        const { data } = await apiClient.post('/auth/update-email', { 
          newEmail: formData.email 
        });
        
        if (!data.success) {
          toast.error(data.message || "Failed to update email");
          return;
        }
      }
      
      // Update user profile
      await updateUserProfile({
        name: formData.name,
        email: formData.email,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
        socialLinks: {
          linkedin: formData.linkedinUrl,
          github: formData.githubUrl,
          twitter: formData.twitterUrl,
          website: formData.websiteUrl,
        },
      });
      
      // Exit edit mode
      setIsEditing(false);
      toast.success("Profile updated successfully");
      
      // If email changed, notify user to use new email for login
      if (formData.email !== userProfile.email) {
        toast.info("Your login email has been updated. Please use your new email for future logins.");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Simplify edit toggle to just handle edit mode
  const handleEditToggle = () => {
    setIsEditing(true);
  };

  // Update handleSubmit to call the new save function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProfile();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const generateQRCode = async () => {
    if (generatingQR) return;

    try {
      setGeneratingQR(true);
      const { data } = await apiClient.post('/users/generate-qrcode');
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        toast.success('QR code generated successfully');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${userProfile.name.replace(/\s+/g, '-')}-profile-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelEdit = () => {
    // Reset form data to original values
    setFormData({
      name: userProfile.name || "",
      email: userProfile.email || "",
      title: userProfile.title || "",
      bio: userProfile.bio || "",
      location: userProfile.location || "",
      linkedinUrl: userProfile.socialLinks?.linkedin || "",
      githubUrl: userProfile.socialLinks?.github || "",
      twitterUrl: userProfile.socialLinks?.twitter || "",
      websiteUrl: userProfile.socialLinks?.website || "",
    });
    setEmailError("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden md:flex items-center gap-2 btn-animated">
              <ShareIcon className="h-4 w-4" />
              Share Public Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Profile</DialogTitle>
              <DialogDescription>
                Anyone with this link or QR code can view your public profile, including your skills and certifications.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="link" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Share Link</TabsTrigger>
                <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Input 
                    readOnly 
                    value={shareableLink} 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copyToClipboard}
                    className="btn-animated"
                  >
                    {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="qrcode" className="mt-4">
                <div className="flex flex-col items-center space-y-4">
                  {qrCodeUrl ? (
                    <>
                      <div className="bg-white p-3 rounded">
                        <img src={qrCodeUrl} alt="Profile QR Code" className="w-full h-auto max-w-[200px]" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={downloadQRCode} variant="outline" size="sm" className="btn-animated">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button onClick={generateQRCode} variant="outline" size="sm" disabled={generatingQR} className="btn-animated">
                          <QrCode className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex flex-col items-center gap-4">
                      <QrCode className="h-12 w-12 text-muted-foreground" />
                      <Button onClick={generateQRCode} disabled={generatingQR} className="btn-animated">
                        {generatingQR ? 'Generating...' : 'Generate QR Code'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button className="btn-animated">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="profile-card">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Update your profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProfileImageUpload 
                currentImage={userProfile.avatarUrl}
                name={userProfile.name}
                size="xl"
              />
            </CardContent>
          </Card>

          {!loading && gamificationData && (
            <Card className="mt-6 profile-card">
              <CardHeader>
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Your achievements and badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserBadges 
                  badges={gamificationData.badges} 
                  achievements={gamificationData.achievements}
                  level={gamificationData.level}
                  points={gamificationData.points}
                  learningStreak={gamificationData.learningStreak}
                />
              </CardContent>
            </Card>
          )}
          
          <Card className="profile-card">
            <CardHeader>
              <CardTitle>Resume</CardTitle>
              <CardDescription>
                Generate a professional resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeGeneratorDialog />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="profile-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Edit your personal details" : "Your personal details"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="Your name" 
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="space-y-1">
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="Your email" 
                        readOnly={!isEditing}
                        className={`${!isEditing ? "bg-muted cursor-not-allowed" : ""} ${emailError ? "border-red-500" : ""}`}
                        required
                      />
                      {isCheckingEmail && <p className="text-xs text-muted-foreground">Checking email...</p>}
                      {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title || ""} 
                    onChange={handleInputChange} 
                    placeholder="e.g., Computer Science Student" 
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    value={formData.location || ""} 
                    onChange={handleInputChange} 
                    placeholder="e.g., New York, USA" 
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio || ""} 
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    className={`min-h-[100px] ${!isEditing ? "bg-muted cursor-not-allowed" : ""}`}
                    readOnly={!isEditing}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Social Links</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                    <Input 
                      id="linkedinUrl" 
                      name="linkedinUrl" 
                      value={formData.linkedinUrl || ""} 
                      onChange={handleInputChange} 
                      placeholder="https://linkedin.com/in/yourprofile" 
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub</Label>
                    <Input 
                      id="githubUrl" 
                      name="githubUrl" 
                      value={formData.githubUrl || ""} 
                      onChange={handleInputChange} 
                      placeholder="https://github.com/yourusername" 
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter</Label>
                    <Input 
                      id="twitterUrl" 
                      name="twitterUrl" 
                      value={formData.twitterUrl || ""} 
                      onChange={handleInputChange} 
                      placeholder="https://twitter.com/yourusername" 
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Personal Website</Label>
                    <Input 
                      id="websiteUrl" 
                      name="websiteUrl" 
                      value={formData.websiteUrl || ""} 
                      onChange={handleInputChange} 
                      placeholder="https://yourwebsite.com" 
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    onClick={handleEditToggle}
                    className="w-full md:w-auto btn-animated"
                    disabled={isEditing}
                  >
                    Edit Profile
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={handleSaveProfile}
                    className="w-full md:w-auto btn-animated"
                    disabled={!isEditing || !!emailError || isCheckingEmail || isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  
                  {isEditing && (
                    <Button 
                      type="button" 
                      onClick={cancelEdit}
                      variant="outline"
                      className="w-full md:w-auto btn-animated"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          
          <EducationSection />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
