import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X, FileUp, Check, AlertTriangle, Shield, Database, Image } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../ui/use-toast';
import { useAppContext } from '@/context/AppContext';

interface VerificationResult {
  success: boolean;
  verification: {
    extractedText: string;
    verificationResult: {
      confidenceScore: number;
      textMatchScore: number;
      imageIntegrityScore: number | null;
      aiDecision: 'verified' | 'rejected' | 'needs_review';
      reasoning: string[];
      redFlags: string[];
      enhancedVerification: boolean;
      verificationDetails: {
        titleFound: boolean;
        issuerFound: boolean;
        dateFound: boolean;
        credentialIDFound: boolean;
        credentialURLFound: boolean; 
        holderNameFound: boolean;
        nameMatchConfidence: number;
      };
    };
    issuerDatabaseResult?: {
      issuerVerified: boolean;
      databaseChecked: boolean;
      credentialValid?: boolean;
      holderValid?: boolean;
      message: string;
    };
    imageIntegrityAnalysis?: {
      integrityScore: number;
      metadataConsistent: boolean;
      compressionArtifacts: boolean;
      pixelPatternConsistent: boolean;
    };
    aiDecision: 'verified' | 'rejected' | 'needs_review';
    confidenceScore: number;
    reasoning: string[];
    redFlags: string[];
    enhancedVerification: boolean;
  };
}

const AdvancedVerification: React.FC = () => {
  const { toast } = useToast();
  const { checkForBadges } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    credentialID: '',
    holderName: '',
    credentialURL: ''
  });
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCertificateData({
      ...certificateData,
      [name]: value
    });
  };
  
  const handleVerify = async () => {
    if (!file && !imagePreview) {
      toast({
        title: "Error",
        description: "Please upload a certificate image",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      setVerificationResult(null);
      
      // Convert image to base64 if not already
      const imageUrl = imagePreview;
      
      // Prepare request data
      const requestData = {
        imageUrl,
        title: certificateData.title,
        issuer: certificateData.issuer,
        issueDate: certificateData.issueDate,
        credentialID: certificateData.credentialID,
        credentialURL: certificateData.credentialURL || '',
        holderName: certificateData.holderName
      };
      
      // Send verification request
      const response = await axios.post('/api/ml/verify-certificate', requestData);
      
      if (response.data && response.data.success) {
        setVerificationResult(response.data);
        setActiveTab('result');
        
        // Show toast based on verification result
        const decision = response.data.verification?.aiDecision;
        
        if (decision === 'verified') {
          toast({
            title: "Certificate Verified",
            description: "This certificate appears to be authentic.",
            variant: "default"
          });
          
          // Check for badges after successful verification
          try {
            if (checkForBadges) {
              await checkForBadges();
            }
          } catch (badgeError) {
            console.error("Error checking for badges:", badgeError);
          }
        } else if (decision === 'rejected') {
          toast({
            title: "Certificate Rejected",
            description: "This certificate appears to be invalid.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Verification Complete",
            description: "This certificate needs additional review.",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Verification Failed",
          description: response.data?.message || "Unable to verify certificate",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setImagePreview(null);
    setCertificateData({
      title: '',
      issuer: '',
      issueDate: '',
      credentialID: '',
      holderName: '',
      credentialURL: ''
    });
    setVerificationResult(null);
    setActiveTab('upload');
  };
  
  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium-high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      case 'questionable': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getSecurityLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'High Security';
      case 'medium-high': return 'Medium-High Security';
      case 'medium': return 'Medium Security';
      case 'low': return 'Low Security';
      case 'questionable': return 'Questionable Security';
      default: return 'Unknown Security';
    }
  };
  
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getResultIcon = (decision: string) => {
    switch (decision) {
      case 'verified':
        return <Check className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <X className="h-6 w-6 text-red-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Advanced Certificate Verification
          </CardTitle>
          <CardDescription>
            Verify certificate authenticity using AI-powered analysis
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Certificate</TabsTrigger>
            <TabsTrigger value="details">Certificate Details</TabsTrigger>
            <TabsTrigger value="result" disabled={!verificationResult}>Verification Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 min-h-[200px]">
                {imagePreview ? (
                  <div className="relative w-full">
                    <img 
                      src={imagePreview} 
                      alt="Certificate preview" 
                      className="max-h-[300px] mx-auto object-contain rounded-lg" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full bg-white"
                      onClick={() => {
                        setFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold">Upload certificate image</h3>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, or PDF up to 10MB</p>
                    <Button className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={() => setActiveTab('details')} disabled={!imagePreview}>
                Next: Enter Details
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="details">
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Certificate Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Advanced Machine Learning"
                      value={certificateData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuer">Issuer</Label>
                    <Input
                      id="issuer"
                      name="issuer"
                      placeholder="e.g. Coursera, Udemy"
                      value={certificateData.issuer}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      value={certificateData.issueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentialID">Credential ID (Optional)</Label>
                    <Input
                      id="credentialID"
                      name="credentialID"
                      placeholder="e.g. ABC123XYZ"
                      value={certificateData.credentialID}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="holderName">Certificate Holder Name</Label>
                  <Input
                    id="holderName"
                    name="holderName"
                    placeholder="e.g. John Doe"
                    value={certificateData.holderName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="credentialURL">Credential URL (Optional)</Label>
                  <Input
                    id="credentialURL"
                    name="credentialURL"
                    placeholder="e.g. https://example.com/credential"
                    value={certificateData.credentialURL}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mt-2">
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Important:</strong> Credential ID is now optional but highly recommended when available. 
                      When provided, it significantly improves verification accuracy as our AI system will 
                      prioritize matching and validating the credential ID against issuer databases.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="pt-2">
                  <Alert className="bg-blue-50 border-blue-200">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 text-blue-500 mr-2" />
                      <AlertDescription className="text-blue-800 text-xs">
                        <strong>Enhanced Security:</strong> All certificates are automatically verified against issuer 
                        databases when possible, providing improved security and fraud detection.
                      </AlertDescription>
                    </div>
                  </Alert>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('upload')}>
                Back
              </Button>
              <Button onClick={handleVerify} disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Verifying...
                  </>
                ) : (
                  <>Verify Certificate</>
                )}
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="result">
            {verificationResult && (
              <CardContent className="space-y-6 pt-4">
                {/* Summary Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getResultIcon(verificationResult.verification.verificationResult.aiDecision)}
                    <h3 className="text-lg font-semibold">
                      {verificationResult.verification.verificationResult.aiDecision === 'verified' && 'Certificate Appears Authentic'}
                      {verificationResult.verification.verificationResult.aiDecision === 'rejected' && 'Certificate Appears Invalid'}
                      {verificationResult.verification.verificationResult.aiDecision === 'needs_review' && 'Certificate Needs Review'}
                    </h3>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      {verificationResult.verification.verificationResult.reasoning.join(', ')}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant={getSecurityLevelColor(verificationResult.verification.verificationResult.aiDecision === 'verified' ? 'high' : verificationResult.verification.verificationResult.aiDecision === 'rejected' ? 'low' : 'questionable')}>
                      {verificationResult.verification.verificationResult.aiDecision === 'verified' ? 'High Security' : verificationResult.verification.verificationResult.aiDecision === 'rejected' ? 'Low Security' : 'Questionable Security'}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                {/* Confidence Scores */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Verification Confidence</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Overall Confidence</Label>
                      <span className={`font-medium ${getConfidenceColor(verificationResult.verification.verificationResult.confidenceScore)}`}>
                        {verificationResult.verification.verificationResult.confidenceScore}%
                      </span>
                    </div>
                    <Progress value={verificationResult.verification.verificationResult.confidenceScore} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Text Match Score</Label>
                        <span className={`font-medium ${getConfidenceColor(verificationResult.verification.verificationResult.textMatchScore)}`}>
                          {verificationResult.verification.verificationResult.textMatchScore}%
                        </span>
                      </div>
                      <Progress value={verificationResult.verification.verificationResult.textMatchScore} className="h-2" />
                    </div>
                    
                    {verificationResult.verification.verificationResult.imageIntegrityScore !== null && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm">Image Integrity</Label>
                          <span className={`font-medium ${getConfidenceColor(verificationResult.verification.verificationResult.imageIntegrityScore)}`}>
                            {verificationResult.verification.verificationResult.imageIntegrityScore}%
                          </span>
                        </div>
                        <Progress value={verificationResult.verification.verificationResult.imageIntegrityScore} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Verification Details */}
                <div className="space-y-2">
                  <h3 className="text-md font-semibold">Verification Details</h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Title Match:</span>
                      {verificationResult.verification.verificationResult.verificationDetails.titleFound ? (
                        <Badge variant="outline">Found</Badge>
                      ) : (
                        <Badge variant="outline">Not Found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Issuer Match:</span>
                      {verificationResult.verification.verificationResult.verificationDetails.issuerFound ? (
                        <Badge variant="outline">Found</Badge>
                      ) : (
                        <Badge variant="outline">Not Found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Date Match:</span>
                      {verificationResult.verification.verificationResult.verificationDetails.dateFound ? (
                        <Badge variant="outline">Found</Badge>
                      ) : (
                        <Badge variant="outline">Not Found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Credential ID Match:</span>
                      {verificationResult.verification.verificationResult.verificationDetails.credentialIDFound ? (
                        <Badge variant="outline">Found</Badge>
                      ) : (
                        <Badge variant="outline">Not Found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Credential URL Match:</span>
                      {verificationResult.verification.verificationResult.verificationDetails.credentialURLFound ? (
                        <Badge variant="outline">Found</Badge>
                      ) : (
                        <Badge variant="outline">Not Found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Holder Name Match:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {verificationResult.verification.verificationResult.verificationDetails.holderNameFound ? (
                              <Badge variant="outline">Found</Badge>
                            ) : (
                              <Badge variant="outline">Not Found</Badge>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            Name match confidence: {verificationResult.verification.verificationResult.verificationDetails.nameMatchConfidence.toFixed(1)}%
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {verificationResult.verification.issuerDatabaseResult && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Issuer Database:</span>
                        {verificationResult.verification.issuerDatabaseResult.issuerVerified ? (
                          <Badge variant="outline">Verified</Badge>
                        ) : verificationResult.verification.issuerDatabaseResult.databaseChecked ? (
                          <Badge variant="outline">Not Verified</Badge>
                        ) : (
                          <Badge variant="outline">Not Available</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* AI Reasoning */}
                {verificationResult.verification.verificationResult.reasoning.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-md font-semibold">AI Reasoning</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {verificationResult.verification.verificationResult.reasoning.map((reason, index) => (
                          <li key={index} className="text-sm">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                
                {/* Extracted Text Preview */}
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-md font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Text Extracted from Certificate
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm font-mono max-h-32 overflow-y-auto">
                    {verificationResult.verification.verificationResult.extractedText}
                  </div>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Verify Another Certificate
              </Button>
              <Button variant="secondary" onClick={() => setActiveTab('details')}>
                Adjust Details
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdvancedVerification; 