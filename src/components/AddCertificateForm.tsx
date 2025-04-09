import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Award, Upload, Link, FileText, Image, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

// Predefined categories for certificates
const PREDEFINED_CATEGORIES = [
  "Web Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Data Science",
  "Data Engineering",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "UI/UX Design",
  "Mobile Development",
  "DevOps",
  "Blockchain",
  "IoT",
  "Game Development",
  "Digital Marketing",
  "Project Management",
  "Business Analytics",
  "Network Engineering",
  "Software Engineering", 
  "Java Development",
  "Python Development",
  "JavaScript Development",
  "Other"
];

// Predefined skill categories
const SKILL_CATEGORIES = {
  "Programming Languages": ["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "PHP", "Swift", "Kotlin", "TypeScript", "Rust"],
  "Web Development": ["HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask", "Spring Boot", "ASP.NET"],
  "Mobile Development": ["React Native", "Flutter", "iOS", "Android", "Xamarin", "Swift UI"],
  "Data Science": ["Pandas", "NumPy", "Matplotlib", "Scikit-learn", "TensorFlow", "PyTorch", "R", "Data Analysis", "Statistics"],
  "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "Git", "GitHub Actions", "Terraform"],
  "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Oracle", "Firebase"],
  "Cloud": ["AWS", "Azure", "GCP", "Serverless", "Lambda", "S3", "EC2", "Cloud Architecture"],
  "Other": []
};

const AddCertificateForm: React.FC = () => {
  const { addCertificate } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    date: new Date().toISOString().split("T")[0],
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    skills: "",
    category: "",
    customCategory: "", 
    imageUrl: "/placeholder.svg",
    isPublic: true,
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === "Other") {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: value }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value, customCategory: "" }));
    }
  };

  const handleSkillCategoryChange = (value: string) => {
    setSelectedSkillCategory(value);
  };

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      updateSkillsFormData([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill && !selectedSkills.includes(customSkill)) {
      setSelectedSkills([...selectedSkills, customSkill]);
      updateSkillsFormData([...selectedSkills, customSkill]);
      setCustomSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(updatedSkills);
    updateSkillsFormData(updatedSkills);
  };

  const updateSkillsFormData = (skills: string[]) => {
    setFormData(prev => ({
      ...prev,
      skills: skills.join(", ")
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size - limit to 2MB to avoid upload issues
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image file must be less than 2MB",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Processing image file: ${file.name}, size: ${file.size / 1024} KB, type: ${file.type}`);
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log(`Image converted to data URL, length: ${dataUrl.length}`);
        setCertificateImage(dataUrl);
        setCertificateFile(null); // Reset PDF if image is uploaded
      };
      reader.onerror = (error) => {
        console.error("Error reading image file:", error);
        toast({
          title: "Error reading file",
          description: "Failed to process the image file",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size - limit to 2MB to avoid upload issues
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "PDF file must be less than 2MB",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Processing PDF file: ${file.name}, size: ${file.size / 1024} KB`);
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log(`PDF converted to data URL, length: ${dataUrl.length}`);
        setCertificateFile(dataUrl);
        setCertificateImage(null); // Reset image if PDF is uploaded
      };
      reader.onerror = (error) => {
        console.error("Error reading PDF file:", error);
        toast({
          title: "Error reading file",
          description: "Failed to process the PDF file",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePublic = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPublic: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.issuer.trim() || !formData.date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Show loading state
    setIsSubmitting(true);
    
    // Show toast to inform user upload is in progress
    toast({
      title: "Uploading certificate...",
      description: "This may take a few moments, especially for PDFs.",
    });
    
    // Use custom category if "Other" is selected
    const finalCategory = formData.category === "Other" && formData.customCategory 
      ? formData.customCategory 
      : formData.category;
    
    // Debug log
    console.log("Certificate submission details:", {
      activeTab,
      hasImage: Boolean(certificateImage),
      hasPdf: Boolean(certificateFile),
      credentialUrl: formData.credentialUrl
    });
    
    // Prepare certificate data based on active tab
    let certificateData = {
      ...formData,
      date: formData.date,
      skills: selectedSkills.length > 0 ? selectedSkills : formData.skills.split(",").map((skill) => skill.trim()),
      certificateImage: activeTab === "url" ? null : certificateImage,
      certificateFile: activeTab === "url" ? null : certificateFile,
      credentialUrl: activeTab === "url" ? formData.credentialUrl : null,
      category: finalCategory,
    };
    
    // Log final submission data
    console.log("Submitting certificate with data:", {
      title: certificateData.title,
      issuer: certificateData.issuer,
      hasImage: Boolean(certificateData.certificateImage),
      hasPdf: Boolean(certificateData.certificateFile),
      hasCredentialUrl: Boolean(certificateData.credentialUrl),
      imageType: certificateData.certificateImage ? certificateData.certificateImage.substring(0, 30) + "..." : "none",
      pdfType: certificateData.certificateFile ? certificateData.certificateFile.substring(0, 30) + "..." : "none"
    });
    
    try {
      console.log('Submitting certificate...', certificateData);
      await addCertificate(certificateData);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        issuer: '',
        date: new Date().toISOString().split('T')[0],
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        skills: '',
        category: '',
        customCategory: '',
        imageUrl: '/placeholder.svg',
        isPublic: true
      });
      setSelectedSkills([]);
      setSelectedSkillCategory('');
      setCustomSkill('');
      setCertificateImage(null);
      setCertificateFile(null);
      setActiveTab('url');
      
      // Close the dialog after successful submission
      setIsOpen(false);
      
      // Show success message
      toast({
        title: "Success!",
        description: "Certificate added successfully.",
      });
    } catch (error) {
      console.error('Error submitting certificate:', error);
      toast({
        title: "Error",
        description: "Failed to add certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-md">
          <Award className="h-4 w-4" />
          Add Certificate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Certificate</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the details to add a new certificate to your profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Certificate Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issuer">Issuing Organization *</Label>
              <Input
                id="issuer"
                name="issuer"
                value={formData.issuer}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Issue Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Certificate Category *</Label>
              <Select 
                onValueChange={handleCategoryChange}
                value={formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomCategory && (
                <div className="mt-2">
                  <Input
                    id="customCategory"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleChange}
                    placeholder="Enter custom category"
                    required={formData.category === "Other"}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-4 border p-4 rounded-md bg-muted/30">
              <Label>Skills *</Label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSkills.map(skill => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground"
                  >
                    {skill}
                    <button 
                      type="button" 
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-xs hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="skillCategory">Select Skill Category</Label>
                  <Select 
                    onValueChange={handleSkillCategoryChange}
                    value={selectedSkillCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(SKILL_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedSkillCategory && (
                  <div>
                    <Label htmlFor="skillList">Select Skills</Label>
                    <Select onValueChange={(value) => addSkill(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORIES[selectedSkillCategory as keyof typeof SKILL_CATEGORIES].map((skill) => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="customSkill">Add Custom Skill</Label>
                  <Input
                    id="customSkill"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Enter a custom skill"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={addCustomSkill}
                  disabled={!customSkill}
                >
                  Add
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground italic">
                {selectedSkills.length === 0 && "Please add at least one skill"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credentialId">Credential ID (Optional)</Label>
              <Input
                id="credentialId"
                name="credentialId"
                value={formData.credentialId}
                onChange={handleChange}
                placeholder="Enter credential ID if available (improves verification accuracy)"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Certificate Credential</Label>
              <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <Link className="h-4 w-4" />
                    URL Link
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    Image File
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    PDF File
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="pt-2">
              <Input
                id="credentialUrl"
                name="credentialUrl"
                type="url"
                value={formData.credentialUrl}
                onChange={handleChange}
                placeholder="https://"
                    required={activeTab === "url"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter the URL where your certificate can be verified or viewed</p>
                </TabsContent>
                
                <TabsContent value="image" className="pt-2">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    {certificateImage ? (
                      <div className="text-center">
                        <img 
                          src={certificateImage} 
                          alt="Certificate preview" 
                          className="max-h-48 object-contain mx-auto mb-2" 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCertificateImage(null)}
                        >
                          Replace Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium mb-1">Upload Certificate Image</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          JPG, PNG or GIF up to 5MB
                        </p>
                        <Input
                          id="certificate-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          required={activeTab === "image"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("certificate-image")?.click()}
                        >
                          Select File
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pdf" className="pt-2">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    {certificateFile ? (
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium mb-2">PDF Selected</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCertificateFile(null)}
                        >
                          Replace PDF
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium mb-1">Upload Certificate PDF</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          PDF document up to 5MB
                        </p>
                        <Input
                          id="certificate-pdf"
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handlePdfUpload}
                          required={activeTab === "pdf"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("certificate-pdf")?.click()}
                        >
                          Select File
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex items-center justify-between space-y-0 pt-1">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="isPublic" className="text-base">Certificate Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isPublic 
                    ? "Your certificate will be visible to the public" 
                    : "Your certificate will be private"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublic" 
                  checked={formData.isPublic}
                  onCheckedChange={handleTogglePublic}
                />
                <div className="flex items-center gap-1">
                  {formData.isPublic 
                    ? <Globe className="h-4 w-4 text-muted-foreground" /> 
                    : <Lock className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm">{formData.isPublic ? "Public" : "Private"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={
                selectedSkills.length === 0 || 
                !formData.title || 
                !formData.issuer || 
                !formData.date || 
                (activeTab === "url" && !formData.credentialUrl) ||
                (activeTab === "image" && !certificateImage) ||
                (activeTab === "pdf" && !certificateFile) ||
                (formData.category === "Other" && !formData.customCategory)
              }
            >
              Save Certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCertificateForm;
