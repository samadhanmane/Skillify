import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Award, Share2, CheckCircle, BarChart2, ShieldCheck, FileText, Users, Cloud } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-[1fr_600px] lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Manage Your Credentials with Confidence
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Skillify Credentials Hub helps you securely store, verify, and share your professional certificates and skills in one centralized platform.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
            onClick={() => navigate('/login')} 
                    className="h-12 px-8 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all"
                    size="lg"
          >
            Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')} 
                    variant="outline"
                    className="h-12 px-8 font-medium border-blue-200 text-blue-600 hover:bg-blue-50"
                    size="lg"
                  >
                    Create Free Account
                  </Button>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>Easy Upload</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>Secure Storage</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>Instant Sharing</span>
                  </div>
                </div>
              </div>
              <div className="relative lg:ml-10">
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="p-1">
                    <img 
                      alt="Platform preview" 
                      className="w-full object-cover" 
                      src="/auth-background.jpg"
                      style={{ height: "400px", objectFit: "cover" }}
                    />
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <Award className="h-12 w-12 text-blue-600" />
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ShieldCheck className="h-12 w-12 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Skillify Credentials Hub?</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                Our platform makes it simple to manage all your professional credentials in one place
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Credential Management</h3>
                <p className="text-gray-500">
                  Upload and organize all your certificates, diplomas, and credentials in various formats including PDFs and images.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Verification System</h3>
                <p className="text-gray-500">
                  Our AI-powered verification technology confirms the authenticity of your credentials, building trust with employers.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Selective Sharing</h3>
                <p className="text-gray-500">
                  Control which credentials are public or private, and easily share your verified skills with potential employers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                Get started in just three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-10 mt-16">
              <div className="relative">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">1</div>
                <div className="border-t-4 border-blue-600 pt-8 text-center">
                  <h3 className="text-xl font-bold mb-3">Upload Your Credentials</h3>
                  <p className="text-gray-500">
                    Add your certificates by uploading PDFs, images, or simply linking to online credentials.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">2</div>
                <div className="border-t-4 border-blue-600 pt-8 text-center">
                  <h3 className="text-xl font-bold mb-3">Verify & Organize</h3>
                  <p className="text-gray-500">
                    Our system verifies your credentials and helps you organize them by category and skills.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">3</div>
                <div className="border-t-4 border-blue-600 pt-8 text-center">
                  <h3 className="text-xl font-bold mb-3">Share Your Profile</h3>
                  <p className="text-gray-500">
                    Create a professional profile and selectively share your verified skills with potential employers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial/Stats Section */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-gray-500">Secure Storage</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-gray-500">Access Anywhere</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">1-Click</div>
                <p className="text-gray-500">Credential Sharing</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to organize your professional credentials?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join thousands of professionals who trust Skillify for their credential management
            </p>
            <Button 
            onClick={() => navigate('/signup')} 
              className="h-12 px-8 font-medium bg-white text-blue-600 hover:bg-blue-50"
              size="lg"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Skillify</h3>
            <p className="text-gray-500 text-sm mb-4">
              Your professional credentials hub for secure storage, verification, and sharing.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Credential Management</li>
              <li>AI Verification</li>
              <li>Skill Organization</li>
              <li>Privacy Controls</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Help Center</li>
              <li>Documentation</li>
              <li>API Integration</li>
              <li>Pricing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>About Us</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 pt-8 mt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Skillify Credentials Hub · All rights reserved
      </div>
      </footer>
    </div>
  );
};

export default Index;
