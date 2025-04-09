import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, School, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Education } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface EducationCardProps {
  education: Education;
  onUpdate: (education: Education) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const EducationCard: React.FC<EducationCardProps> = ({
  education,
  onUpdate,
  onDelete,
  readOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    degree: education.degree,
    university: education.university,
    location: education.location || '',
    graduationYear: education.graduationYear || '',
    startYear: education.startYear || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onUpdate({
        id: education.id,
        ...formData
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const handleDeleteConfirm = async () => {
    // Log the education object for debugging
    console.log('Education object being deleted:', education);
    
    if (!education.id) {
      console.error('Education ID is missing:', education);
      toast.error("Cannot delete: Education ID is missing");
      setIsDeleting(false);
      return;
    }
    
    // Ensure the ID is a string and not undefined or null
    const educationId = String(education.id);
    
    if (!educationId || educationId === 'undefined' || educationId === 'null') {
      console.error('Invalid education ID:', educationId);
      toast.error("Cannot delete: Invalid education ID");
      setIsDeleting(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Deleting education with ID:', educationId);
      await onDelete(educationId);
      toast.success(`Deleted ${education.degree} from education`);
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error("Failed to delete education. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleting(false);
  };

  const durationText = formData.startYear && formData.graduationYear
    ? `${formData.startYear} - ${formData.graduationYear}`
    : formData.graduationYear 
      ? `Graduated: ${formData.graduationYear}`
      : '';

  return (
    <Card className="education-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">{education.degree}</CardTitle>
        {!readOnly && (
          <div className="flex gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Education</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree / Certificate</Label>
                    <Input
                      id="degree"
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">Institution</Label>
                    <Input
                      id="university"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      placeholder="e.g., University of Technology"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., New York, USA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startYear">Start Year</Label>
                      <Input
                        id="startYear"
                        name="startYear"
                        value={formData.startYear}
                        onChange={handleInputChange}
                        placeholder="e.g., 2018"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input
                        id="graduationYear"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        placeholder="e.g., 2022"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive" 
              onClick={handleDeleteClick}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your education record for {education.degree} from {education.university}.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleDeleteCancel} disabled={isLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteConfirm} 
                    disabled={isLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <School className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{education.university}</span>
          </div>
          {education.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{education.location}</span>
            </div>
          )}
          {durationText && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{durationText}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationCard; 