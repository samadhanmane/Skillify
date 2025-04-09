import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BookOpenIcon, 
  GraduationCapIcon, 
  BrainCircuitIcon, 
  TrendingUpIcon,
  PlusIcon,
  InfoIcon,
  LightbulbIcon,
  BookmarkIcon,
  ExternalLinkIcon,
  StarIcon
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Recommendation {
  id: string;
  type: 'skill' | 'course' | 'practice';
  name: string;
  reason: string;
  priority: number;
  description?: string;
  category?: string;
  difficulty?: number;
  relatedSkills?: string[];
  resourceUrl?: string;
  estimatedHours?: number;
  provider?: string;
}

const SkillRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    difficulty: 'all'
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/ml/recommendations');
        if (data.success) {
          setRecommendations(data.recommendations || []);
        } else {
          setError(data.message || 'Failed to fetch recommendations');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Error loading recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const saveRecommendation = (id: string) => {
    setSavedRecommendations(prev => [...prev, id]);
  };

  const removeSavedRecommendation = (id: string) => {
    setSavedRecommendations(prev => prev.filter(recId => recId !== id));
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.type !== 'all' && rec.type !== filters.type) return false;
    if (filters.difficulty !== 'all') {
      const difficultyLevel = parseInt(filters.difficulty);
      if (rec.difficulty !== difficultyLevel) return false;
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'course':
        return <GraduationCapIcon className="h-5 w-5" />;
      case 'practice':
        return <TrendingUpIcon className="h-5 w-5" />;
      default:
        return <LightbulbIcon className="h-5 w-5" />;
    }
  };

  const getDifficultyLabel = (level?: number) => {
    if (!level) return 'Not specified';
    
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Elementary';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Not specified';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Recommendations</AlertTitle>
        <AlertDescription>
          We don't have enough data yet to provide personalized recommendations.
          Add more certificates and skills to get tailored suggestions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Skill Recommendations</h2>
          <p className="text-muted-foreground">
            Personalized recommendations based on your skill profile and learning patterns
          </p>
        </div>
        <div className="flex space-x-2">
          <select 
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="all">All Types</option>
            <option value="skill">Skills</option>
            <option value="course">Courses</option>
            <option value="practice">Practice</option>
          </select>
          <select 
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          >
            <option value="all">All Levels</option>
            <option value="1">Beginner</option>
            <option value="2">Elementary</option>
            <option value="3">Intermediate</option>
            <option value="4">Advanced</option>
            <option value="5">Expert</option>
          </select>
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <Alert>
          <AlertTitle>No Matching Recommendations</AlertTitle>
          <AlertDescription>
            No recommendations match your current filters. Try changing your filter criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecommendations.map((recommendation) => (
            <Card key={recommendation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="mr-2 bg-primary/10 p-2 rounded-full">
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <CardTitle className="text-lg">{recommendation.name}</CardTitle>
                  </div>
                  <Badge variant={
                    recommendation.type === 'skill' ? 'default' : 
                    recommendation.type === 'course' ? 'secondary' : 
                    'outline'
                  }>
                    {recommendation.type === 'skill' ? 'Skill' : 
                     recommendation.type === 'course' ? 'Course' : 
                     'Practice'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {recommendation.description || recommendation.reason}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  {recommendation.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{recommendation.category}</span>
                    </div>
                  )}
                  {recommendation.difficulty && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{getDifficultyLabel(recommendation.difficulty)}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className={`h-3 w-3 ${i < recommendation.difficulty ? 'text-amber-500' : 'text-muted'}`} 
                              fill={i < recommendation.difficulty ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {recommendation.estimatedHours && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">{recommendation.estimatedHours} hours</span>
                    </div>
                  )}
                  {recommendation.provider && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{recommendation.provider}</span>
                    </div>
                  )}
                  {recommendation.relatedSkills && recommendation.relatedSkills.length > 0 && (
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Related Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.relatedSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="pt-3 flex justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => 
                          savedRecommendations.includes(recommendation.id) 
                            ? removeSavedRecommendation(recommendation.id) 
                            : saveRecommendation(recommendation.id)
                        }
                      >
                        <BookmarkIcon 
                          className={`h-5 w-5 ${
                            savedRecommendations.includes(recommendation.id) 
                              ? 'fill-primary text-primary' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{savedRecommendations.includes(recommendation.id) 
                        ? 'Remove from saved' 
                        : 'Save recommendation'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex gap-2">
                  {recommendation.resourceUrl && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(recommendation.resourceUrl, '_blank')}
                          >
                            <ExternalLinkIcon className="h-4 w-4 mr-1" />
                            Resource
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open learning resource</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {recommendation.type === 'skill' && (
                    <Button variant="default" size="sm">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Skill
                    </Button>
                  )}
                  {recommendation.type === 'course' && (
                    <Button variant="default" size="sm">
                      <GraduationCapIcon className="h-4 w-4 mr-1" />
                      Enroll
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {savedRecommendations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Saved Recommendations</CardTitle>
            <CardDescription>Keep track of the recommendations you{"'"}re interested in</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recommendations
                  .filter(rec => savedRecommendations.includes(rec.id))
                  .map(rec => (
                    <div key={rec.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                          {getTypeIcon(rec.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{rec.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{rec.reason}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeSavedRecommendation(rec.id)}
                      >
                        <BookmarkIcon className="h-5 w-5 fill-primary text-primary" />
                      </Button>
                    </div>
                  ))
                }
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      <Alert className="bg-muted/50 border-muted">
        <BrainCircuitIcon className="h-4 w-4" />
        <AlertTitle>How recommendations work</AlertTitle>
        <AlertDescription>
          Recommendations are generated using machine learning algorithms that analyze your skill profile,
          learning patterns, and certificate history. The system identifies gaps in your skill set and suggests
          the most relevant skills, courses, and practice opportunities to enhance your professional profile.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SkillRecommendations; 