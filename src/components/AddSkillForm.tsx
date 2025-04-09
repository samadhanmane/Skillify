import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { Plus, Lightbulb } from "lucide-react";

// Predefined categories for skills
const PREDEFINED_CATEGORIES = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "DevOps",
  "Data Science",
  "Data Engineering",
  "AI/ML",
  "Cloud Computing",
  "Mobile Development",
  "UI/UX Design",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "Game Development",
  "Database",
  "Testing/QA",
  "Project Management",
  "Business Analytics",
  "Network Engineering",
  "Software Engineering",
  "Java Development",
  "Python Development",
  "JavaScript Development",
  "Other"
];

// Predefined skill categories with popular skills
const SKILL_CATEGORIES = {
  "Programming Languages": ["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "PHP", "Swift", "Kotlin", "TypeScript", "Rust"],
  "Web Development": ["HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask", "Spring Boot", "ASP.NET"],
  "Mobile Development": ["React Native", "Flutter", "iOS", "Android", "Xamarin", "Swift UI"],
  "Data Science": ["Pandas", "NumPy", "Matplotlib", "Scikit-learn", "TensorFlow", "PyTorch", "R", "Data Analysis", "Statistics"],
  "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "Git", "GitHub Actions", "Terraform"],
  "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Oracle", "Firebase"],
  "Cloud": ["AWS", "Azure", "GCP", "Serverless", "Lambda", "S3", "EC2", "Cloud Architecture"],
  "UI/UX": ["Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping", "Usability Testing"],
  "Cybersecurity": ["Network Security", "Penetration Testing", "Security Auditing", "Cryptography", "Identity Management"],
  "Other": []
};

const AddSkillForm: React.FC = () => {
  const { addSkill } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: 50,
    category: "",
    customCategory: "",
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState("");
  const [customSkillName, setCustomSkillName] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, level: value[0] }));
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

  const selectPredefinedSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, name: skill }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use custom category if "Other" is selected
    const finalCategory = formData.category === "Other" && formData.customCategory 
      ? formData.customCategory 
      : formData.category;
    
    addSkill({
      name: formData.name,
      level: formData.level,
      category: finalCategory,
    });
    
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 50,
      category: "",
      customCategory: "",
    });
    setShowCustomCategory(false);
    setSelectedSkillCategory("");
    setCustomSkillName("");
  };

  const getLevelLabel = (level: number) => {
    if (level < 30) return "Beginner";
    if (level < 60) return "Intermediate";
    if (level < 85) return "Advanced";
    return "Expert";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-md">
          <Lightbulb className="h-4 w-4" />
          Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Skill</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new skill to your profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-6">
            <div className="space-y-4 border p-4 rounded-md bg-muted/30">
              <Label htmlFor="skillName" className="text-base font-medium">Skill Name *</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="skillCategory" className="text-sm">Browse Skill Categories</Label>
                  <Select 
                    onValueChange={handleSkillCategoryChange}
                    value={selectedSkillCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
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
                    <Label htmlFor="skillList" className="text-sm">Popular Skills</Label>
                    <Select onValueChange={(value) => selectPredefinedSkill(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
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
              
              <div className="pt-3">
                <Label htmlFor="name" className="text-sm">Skill Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., JavaScript, Python, UI Design"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSkillCategory ? 
                    "Select from popular skills above or enter a custom skill name" : 
                    "Browse skill categories or enter your skill name directly"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Skill Category *</Label>
              <Select 
                onValueChange={handleCategoryChange}
                value={formData.category}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="level">Proficiency Level</Label>
                <span className="text-sm font-medium">
                  {formData.level}% - {getLevelLabel(formData.level)}
                </span>
              </div>
              <Slider
                id="level"
                min={1}
                max={100}
                step={1}
                value={[formData.level]}
                onValueChange={handleSliderChange}
              />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!formData.name || !formData.category || (formData.category === "Other" && !formData.customCategory)}
            >
              Save Skill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSkillForm;
