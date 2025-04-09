import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';

interface ProfileImageUploadProps {
  currentImage: string;
  name: string;
  onImageUpdate?: (imageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  name,
  onImageUpdate,
  size = 'lg'
}) => {
  const { updateProfileImage } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size mapping for avatar
  const sizeClass = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload the file
    try {
      setIsUploading(true);
      console.log('Uploading profile image...');

      // Create a new File object with the correct name
      const renamedFile = new File([file], file.name, { type: file.type });
      const imageUrl = await updateProfileImage(renamedFile);

      if (imageUrl) {
        if (onImageUpdate) {
          onImageUpdate(imageUrl);
        }
      } else {
        throw new Error('Failed to update profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to update profile image');
      // Reset preview if upload fails
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <Avatar className={`${sizeClass[size]} border-2 border-muted group-hover:opacity-75 transition-opacity`}>
          <AvatarImage src={previewImage || currentImage} />
          <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="mt-2"
      >
        {isUploading ? 'Uploading...' : 'Change Photo'}
      </Button>
    </div>
  );
};

export default ProfileImageUpload; 