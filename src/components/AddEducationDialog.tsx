import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Education } from '@/lib/types';

interface AddEducationDialogProps {
  onAdd: (education: Omit<Education, 'id'>) => Promise<void>;
}

const AddEducationDialog: React.FC<AddEducationDialogProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    degree: '',
    university: '',
    location: '',
    graduationYear: '',
    startYear: ''
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
      console.log('Submitting education form with data:', formData);
      
      // Add temporary ID to help with tracking (will be replaced by server)
      const educationWithTempId = {
        ...formData,
        id: `temp-${Date.now()}`
      };
      
      console.log('Adding education with temporary ID:', educationWithTempId);
      await onAdd(formData);
      
      // Reset form and close dialog
      setFormData({
        degree: '',
        university: '',
        location: '',
        graduationYear: '',
        startYear: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full btn-animated gap-1">
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Education</DialogTitle>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Education'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEducationDialog; 