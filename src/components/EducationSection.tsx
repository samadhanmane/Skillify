import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import EducationCard from './EducationCard';
import AddEducationDialog from './AddEducationDialog';
import { Education } from '@/lib/types';
import { GraduationCap } from 'lucide-react';

interface EducationSectionProps {
  readOnly?: boolean;
}

const EducationSection: React.FC<EducationSectionProps> = ({ readOnly = false }) => {
  const { education, addEducation, updateEducation, deleteEducation, loading } = useAppContext();

  // Add debug logging
  useEffect(() => {
    console.log('EducationSection rendered with education data:', education);
  }, [education]);

  return (
    <Card className="profile-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
          <CardDescription>
            Your educational background and qualifications
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {education.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {education.map(educationItem => {
                console.log('Rendering education item:', educationItem);
                return (
                  <EducationCard
                    key={educationItem.id}
                    education={educationItem}
                    onUpdate={updateEducation}
                    onDelete={deleteEducation}
                    readOnly={readOnly}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No education entries added yet.
              {!readOnly && " Click the button below to add your education."}
            </p>
          )}

          {!readOnly && (
            <div className="mt-4">
              <AddEducationDialog onAdd={addEducation} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationSection; 