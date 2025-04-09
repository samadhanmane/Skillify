import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, CheckIcon, LogIn } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

// --------- Step Components ---------

const EmailStep = ({ 
  onSubmit, 
  isLoading, 
  defaultEmail = '' 
}: { 
  onSubmit: (email: string) => Promise<void>; 
  isLoading: boolean;
  defaultEmail?: string;
}) => {
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const handleSubmit = async (values: z.infer<typeof emailSchema>) => {
    await onSubmit(values.email);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="you@example.com" 
                    className="pl-9 h-11" 
                    type="email" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full h-11 btn-animated" 
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Code"}
        </Button>

        <div className="mt-4 text-center">
          <Link 
            to="/login"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </Form>
  );
};

const OtpStep = ({ 
  onSubmit, 
  onBack, 
  onResend, 
  isLoading, 
  email 
}: { 
  onSubmit: (otp: string) => Promise<void>; 
  onBack: () => void;
  onResend: () => Promise<void>;
  isLoading: boolean;
  email: string;
}) => {
  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof otpSchema>) => {
    await onSubmit(values.otp);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-900 mb-4">
          <p className="text-blue-800 dark:text-blue-400">
            We've sent a 6-digit code to {email}. Enter it below to continue.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="123456" 
                    className="pl-9 h-11" 
                    maxLength={6}
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full h-11 btn-animated" 
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
          
          <div className="flex justify-between">
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isLoading}
              className="text-sm"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResend}
              disabled={isLoading}
              className="text-sm"
            >
              Resend Code
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

const PasswordStep = ({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (password: string) => Promise<void>; 
  isLoading: boolean;
}) => {
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values: z.infer<typeof passwordSchema>) => {
    await onSubmit(values.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    className="pl-9 pr-9 h-11" 
                    {...field} 
                  />
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="pl-9 pr-9 h-11" 
                    {...field} 
                  />
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full h-11 btn-animated" 
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Form>
  );
};

const SuccessStep = ({ 
  onGoToLogin 
}: { 
  onGoToLogin: () => void;
}) => {
  return (
    <div className="text-center space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-md border border-green-200 dark:border-green-900">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
            <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <p className="text-green-800 dark:text-green-400 font-medium">
          Your password has been reset successfully
        </p>
      </div>
      
      <Button 
        onClick={onGoToLogin} 
        className="w-full h-11 btn-animated"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign in with new password
      </Button>
    </div>
  );
};

// --------- Main Component ---------

const ForgotPasswordPage = () => {
  const { resetPassword, verifyOTP, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleEmailSubmit = async (email: string) => {
    try {
      setIsLoading(true);
      await resetPassword(email);
      setEmail(email);
      setCurrentStep('OTP');
    } catch (error) {
      console.error('Password reset request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    try {
      setIsLoading(true);
      const token = await verifyOTP(email, otp);
      setResetToken(token);
      setCurrentStep('PASSWORD');
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      setIsLoading(true);
      await updatePassword(resetToken, password);
      setCurrentStep('SUCCESS');
    } catch (error) {
      console.error('Password update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      await resetPassword(email);
    } catch (error) {
      console.error('Resend OTP failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'EMAIL':
        return (
          <EmailStep 
            onSubmit={handleEmailSubmit} 
            isLoading={isLoading}
            defaultEmail={email}
          />
        );
      
      case 'OTP':
        return (
          <OtpStep 
            onSubmit={handleOtpSubmit}
            onBack={() => setCurrentStep('EMAIL')}
            onResend={handleResendOtp}
            isLoading={isLoading}
            email={email}
          />
        );
        
      case 'PASSWORD':
        return (
          <PasswordStep 
            onSubmit={handlePasswordSubmit}
            isLoading={isLoading}
          />
        );
        
      case 'SUCCESS':
        return (
          <SuccessStep 
            onGoToLogin={() => navigate('/login')}
          />
        );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card grid md:grid-cols-2">
        <div className="auth-form-side flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Reset Your Password</h2>
            <p className="text-muted-foreground">
              {currentStep === 'EMAIL' && "Enter your email to receive a password reset code"}
              {currentStep === 'OTP' && "Enter the verification code sent to your email"}
              {currentStep === 'PASSWORD' && "Create a new secure password"}
              {currentStep === 'SUCCESS' && "Your password has been reset successfully"}
            </p>
          </div>

          {/* Step content */}
          {renderStepContent()}
        </div>

        <div className="auth-image-side relative">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/30 to-primary/10 backdrop-blur-sm">
            <div className="absolute bottom-12 left-12 right-12 text-white">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Password Recovery</h3>
              <p className="opacity-90">
                We've made the process simple and secure to help you regain access to your account
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

