import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useAppContext } from '@/context/AppContext';
import { FileText, Download, Loader2, FileDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ResumeGeneratorDialog = () => {
  const { generateResume, loading } = useAppContext();
  const [open, setOpen] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('preview');

  const handleGenerateResume = async () => {
    try {
      const data = await generateResume();
      if (data) {
        setResumeData(data);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
    }
  };

  const formatJsonToHtml = (json: any) => {
    if (!json || !json.data) return null;
    
    const data = json.data;
    console.log('Resume data received:', data);
    console.log('Skills data:', data.skills);
    
    return (
      <div className="resume-preview font-sans text-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{data.personalInformation?.fullName}</h1>
          {data.personalInformation?.location && (
            <p className="text-sm text-muted-foreground">{data.personalInformation.location}</p>
          )}
          <div className="flex justify-center gap-2 mt-1 text-sm">
            <span>{data.personalInformation?.email}</span>
            {data.personalInformation?.phoneNumber && (
              <span>• {data.personalInformation.phoneNumber}</span>
            )}
          </div>
          <div className="flex justify-center gap-2 mt-1 text-xs text-blue-600">
            {data.personalInformation?.linkedIn && (
              <a href={data.personalInformation.linkedIn} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
            {data.personalInformation?.gitHub && (
              <a href={data.personalInformation.gitHub} target="_blank" rel="noopener noreferrer">GitHub</a>
            )}
            {data.personalInformation?.portfolio && (
              <a href={data.personalInformation.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a>
            )}
          </div>
        </div>

        {data.summary && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Summary</h2>
            <p>{data.summary}</p>
          </section>
        )}

        {data.skills && data.skills.length > 0 && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Skills</h2>
            
            {(() => {
              // Log the skills count
              console.log('Processing skills for display, count:', data.skills.length);
              
              // Group skills by category
              const categorizedSkills: {[key: string]: any[]} = {};
              data.skills.forEach((skill: any) => {
                const category = skill.category || 'Other';
                if (!categorizedSkills[category]) {
                  categorizedSkills[category] = [];
                }
                categorizedSkills[category].push(skill);
              });
              
              console.log('Categorized skills:', Object.keys(categorizedSkills));
              
              // If no categories created, display all skills in a single list
              if (Object.keys(categorizedSkills).length === 0 && data.skills.length > 0) {
                console.log('No categories found but skills exist, creating default category');
                categorizedSkills['Skills'] = data.skills;
              }
              
              return Object.entries(categorizedSkills).map(([category, skillList]) => (
                <div key={category} className="mb-3">
                  <h3 className="text-sm font-semibold mt-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillList.map((skill: any, index: number) => (
                      <div 
                        key={index} 
                        className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
                      >
                        <span>{skill.title}</span>
                        <div 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ 
                            backgroundColor: skill.level === 'expert' ? '#10b981' : 
                                           skill.level === 'advanced' ? '#3b82f6' :
                                           skill.level === 'intermediate' ? '#f59e0b' : '#6b7280'
                          }}
                          title={`${skill.level} (${skill.experience})`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </section>
        )}

        {(!data.skills || data.skills.length === 0) && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Skills</h2>
            <p className="text-sm text-muted-foreground italic">No skills data available</p>
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Experience</h2>
            <div className="space-y-3">
              {data.experience.map((exp: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{exp.jobTitle}</h3>
                      <p className="text-sm">{exp.company}, {exp.location}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{exp.duration}</span>
                  </div>
                  {exp.responsibility && (
                    <p className="text-sm mt-1">{exp.responsibility}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Education</h2>
            <div className="space-y-3">
              {data.education.map((edu: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-sm">{edu.university}, {edu.location}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Certifications</h2>
            <div className="space-y-1">
              {data.certifications.map((cert: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium">{cert.title}</span>
                  <span className="text-xs text-muted-foreground">{cert.issuingOrganization}, {cert.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section className="mb-4">
            <h2 className="text-md font-bold border-b pb-1 mb-2">Projects</h2>
            <div className="space-y-3">
              {data.projects.map((project: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{project.title}</h3>
                    {project.githubLink && (
                      <a 
                        href={project.githubLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                  <p className="text-sm mt-1">{project.description}</p>
                  {project.technologiesUsed && project.technologiesUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.technologiesUsed.map((tech: string, techIndex: number) => (
                        <span key={techIndex} className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const downloadResumeAsJson = () => {
    if (!resumeData) return;
    
    const jsonString = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadResumeAsPdf = () => {
    if (!resumeData) return;
    
    // Get the resume preview content
    const resumeContent = document.querySelector('.resume-preview');
    if (!resumeContent) return;
    
    // Create a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF');
      return;
    }
    
    // Add content and styling to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>${resumeData.data.personalInformation?.fullName || 'Resume'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 20px;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .resume-content {
              padding: 20px;
            }
            h1 {
              font-size: 22px;
              margin-bottom: 5px;
              text-align: center;
            }
            h2 {
              font-size: 16px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-top: 20px;
            }
            p, div {
              margin: 8px 0;
            }
            .personal-info {
              text-align: center;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
            }
            .skill-tag {
              display: inline-block;
              background-color: #f1f1f1;
              padding: 3px 8px;
              margin: 3px;
              border-radius: 3px;
              font-size: 12px;
            }
            .flex-between {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
          </style>
        </head>
        <body>
          <div class="resume-content">
            <div class="personal-info">
              <h1>${resumeData.data.personalInformation?.fullName || ''}</h1>
              <p>${resumeData.data.personalInformation?.location || ''}</p>
              <p>${resumeData.data.personalInformation?.email || ''}</p>
            </div>
            
            ${resumeData.data.summary ? `
              <div class="section">
                <h2>Summary</h2>
                <p>${resumeData.data.summary}</p>
              </div>
            ` : ''}
            
            ${resumeData.data.skills && resumeData.data.skills.length > 0 ? `
              <div class="section">
                <h2>Skills</h2>
                ${(() => {
                  // Group skills by category
                  const categorizedSkills = {};
                  resumeData.data.skills.forEach(skill => {
                    const category = skill.category || 'Other';
                    if (!categorizedSkills[category]) {
                      categorizedSkills[category] = [];
                    }
                    categorizedSkills[category].push(skill);
                  });
                  
                  return Object.entries(categorizedSkills).map(([category, skillList]) => `
                    <div style="margin-bottom: 10px;">
                      <h3 style="font-size: 14px; margin-bottom: 5px;">${category}</h3>
                      <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${skillList.map(skill => `
                          <div style="
                            display: inline-flex;
                            align-items: center;
                            background-color: #f1f1f1;
                            padding: 4px 10px;
                            margin: 3px;
                            border-radius: 3px;
                            font-size: 12px;
                          ">
                            ${skill.title}
                            <span style="
                              display: inline-block;
                              width: 6px;
                              height: 6px;
                              border-radius: 50%;
                              margin-left: 5px;
                              background-color: ${
                                skill.level === 'expert' ? '#10b981' : 
                                skill.level === 'advanced' ? '#3b82f6' :
                                skill.level === 'intermediate' ? '#f59e0b' : '#6b7280'
                              };
                            " title="${skill.level} (${skill.experience})"></span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('');
                })()}
              </div>
            ` : ''}
            
            ${resumeData.data.experience && resumeData.data.experience.length > 0 ? `
              <div class="section">
                <h2>Experience</h2>
                ${resumeData.data.experience.map(exp => `
                  <div>
                    <div class="flex-between">
                      <div>
                        <strong>${exp.jobTitle || ''}</strong>
                        <div>${exp.company || ''}, ${exp.location || ''}</div>
                      </div>
                      <div>${exp.duration || ''}</div>
                    </div>
                    <p>${exp.responsibility || ''}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${resumeData.data.education && resumeData.data.education.length > 0 ? `
              <div class="section">
                <h2>Education</h2>
                ${resumeData.data.education.map(edu => `
                  <div class="flex-between">
                    <div>
                      <strong>${edu.degree || ''}</strong>
                      <div>${edu.university || ''}, ${edu.location || ''}</div>
                    </div>
                    <div>${edu.graduationYear || ''}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${resumeData.data.certifications && resumeData.data.certifications.length > 0 ? `
              <div class="section">
                <h2>Certifications</h2>
                ${resumeData.data.certifications.map(cert => `
                  <div class="flex-between">
                    <strong>${cert.title || ''}</strong>
                    <div>${cert.issuingOrganization || ''}, ${cert.year || ''}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `);
    
    // Wait for content to load then print
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      // printWindow.close(); // Optional: Close window after print dialog
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full btn-animated gap-1">
          <FileText className="h-4 w-4" />
          Generate Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Resume Generator</DialogTitle>
          <DialogDescription>
            Create a professional resume based on your profile information
          </DialogDescription>
        </DialogHeader>
        
        {!resumeData ? (
          <div className="p-8 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Generate your professional resume</h3>
            <p className="text-muted-foreground mb-6">
              We'll create a resume based on your profile information including skills, education, and certificates.
            </p>
            <Button 
              onClick={handleGenerateResume} 
              disabled={loading.resume}
              className="btn-animated"
            >
              {loading.resume ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2 gap-2">
              <Button 
                onClick={downloadResumeAsPdf}
                className="btn-animated gap-1"
                variant="default"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                onClick={downloadResumeAsJson}
                className="btn-animated gap-1"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </div>
            
            <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Resume Preview</TabsTrigger>
                <TabsTrigger value="json">JSON Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4 bg-white dark:bg-gray-950 p-6 border rounded flex-1 overflow-auto">
                <div className="mb-6 flex justify-center">
                  <Button 
                    onClick={downloadResumeAsPdf}
                    className="btn-animated gap-1"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4" />
                    Save as PDF
                  </Button>
                </div>
                {formatJsonToHtml(resumeData)}
              </TabsContent>
              
              <TabsContent value="json" className="mt-4 flex-1 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-md h-full overflow-auto">
                  <pre className="text-xs">{JSON.stringify(resumeData?.data, null, 2)}</pre>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResumeData(null);
                  setOpen(false);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResumeGeneratorDialog; 