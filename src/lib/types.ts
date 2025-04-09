export type Skill = {
  id: string;
  name: string;
  level: number; // 0-100
  category: string;
};

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  credentialURL?: string;
  skills: string[] | any[]; // Can be either string[] or skill objects
  category: string;
  imageUrl: string;
  certificateImage?: string;
  certificateFile?: string;
  fileType?: 'image' | 'pdf' | 'url' | 'none';
  isPublic?: boolean;
}

export interface Education {
  id?: string;
  degree: string;
  university: string;
  location?: string;
  graduationYear?: string;
  startYear?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  qrCodeUrl?: string;
  education?: Education[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}
