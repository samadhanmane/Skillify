import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import SkillCard from "@/components/SkillCard";
import AddSkillForm from "@/components/AddSkillForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SortAsc, Filter, X, RefreshCw, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Predefined categories for filter
const PREDEFINED_CATEGORIES = [
  "All Categories",
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

const SkillsPage: React.FC = () => {
  const { skills, refreshData, deleteSkill, updateSkill, loading } = useAppContext();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterLevel, setFilterLevel] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Handle showing the add skill form
  const openAddSkillForm = () => {
    // Find the add skill button in the DOM and click it
    const addButton = document.querySelector('button[aria-label="Add Skill"]');
    if (addButton instanceof HTMLElement) {
      addButton.click();
    }
  };

  // Handle editing a skill
  const handleEditSkill = (skill) => {
    // This should open an edit dialog or navigate to edit page
    console.log('Edit skill:', skill);
  };

  // Handle deleting a skill
  const handleDeleteSkill = (skillId) => {
    deleteSkill(skillId);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setFilterCategory("All Categories");
    setFilterLevel([0, 100]);
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== "All Categories") count++;
    if (filterLevel[0] > 0 || filterLevel[1] < 100) count++;
    if (search) count++;
    return count;
  }, [filterCategory, filterLevel, search]);

  // Get level label based on value
  const getLevelLabel = (level: number) => {
    if (level < 30) return "Beginner";
    if (level < 60) return "Intermediate";
    if (level < 85) return "Advanced";
    return "Expert";
  };

  // Get unique categories from skills
  const skillCategories = useMemo(() => {
    const uniqueCategories = new Set(skills.map((skill) => skill.category));
    return Array.from(uniqueCategories);
  }, [skills]);

  const filteredAndSortedSkills = useMemo(() => {
    let filtered = skills.filter((skill) => {
      // Search filter
      const searchMatch = 
        search === "" ||
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        skill.category.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const categoryMatch = 
        filterCategory === "All Categories" || 
        skill.category.toLowerCase() === filterCategory.toLowerCase();

      // Level filter
      const levelMatch = 
        skill.level >= filterLevel[0] && 
        skill.level <= filterLevel[1];

      return searchMatch && categoryMatch && levelMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "level") {
        return b.level - a.level;
      } else {
        return a.category.localeCompare(b.category);
      }
    });
  }, [skills, search, sortBy, filterCategory, filterLevel]);

  // Initial data load on mount (just to be double sure)
  useEffect(() => {
    // Create a flag in localStorage to prevent infinite refresh
    const hasAttemptedInitialLoad = localStorage.getItem('skills_initial_load_attempted');
    
    if (!loading.skills && skills.length === 0 && !hasAttemptedInitialLoad) {
      // Set the flag before attempting to refresh
      localStorage.setItem('skills_initial_load_attempted', 'true');
      refreshData();
    }
  }, [loading.skills, skills, refreshData]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Skills</h1>
          <p className="text-muted-foreground">
            Manage and track your professional skills.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <AddSkillForm />
        </div>
      </div>

      {/* Search and filter section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 sm:flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            
            <Select onValueChange={setSortBy} value={sortBy}>
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="level">Level</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Advanced filters */}
        {showFilters && (
          <div className="p-4 border rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select onValueChange={setFilterCategory} value={filterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {PREDEFINED_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    
                    {/* Add any unique categories from skills that aren't in the predefined list */}
                    {skillCategories
                      .filter(cat => !PREDEFINED_CATEGORIES.includes(cat))
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Skill Level</label>
                  <span className="text-xs text-muted-foreground">
                    {getLevelLabel(filterLevel[0])} to {getLevelLabel(filterLevel[1])}
                  </span>
                </div>
                <div className="pt-2 px-1">
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={filterLevel}
                    onValueChange={setFilterLevel}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skill cards */}
      {filteredAndSortedSkills.length === 0 ? (
        <div className="text-center py-12">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-muted-foreground/50 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" 
                />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Skills Available</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't added any skills to your profile yet. Showcase your abilities by adding the technologies you're proficient in!
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm inline-flex items-center">
                <span className="mr-2">💡</span>
                Use the <span className="font-semibold mx-1">Add Skill</span> button in the top right to get started.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
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
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" 
                />
              </svg>
              <p className="text-muted-foreground mb-3">
                No skills match your search and filter criteria.
              </p>
              <Button 
                variant="link" 
                onClick={resetFilters}
                className="mt-1"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Result count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredAndSortedSkills.length} of {skills.length} skills
          </p>
          
          {/* Skill grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedSkills.map((skill) => (
              <SkillCard 
                key={skill.id} 
                skill={skill}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
