
import { Certificate, Skill, UserProfile } from "./types";

export const mockSkills: Skill[] = [
  { id: "1", name: "JavaScript", level: 85, category: "Frontend" },
  { id: "2", name: "React", level: 82, category: "Frontend" },
  { id: "3", name: "TypeScript", level: 75, category: "Frontend" },
  { id: "4", name: "Node.js", level: 68, category: "Backend" },
  { id: "5", name: "Python", level: 72, category: "Backend" },
  { id: "6", name: "UI/UX Design", level: 65, category: "Design" },
  { id: "7", name: "DevOps", level: 55, category: "Infrastructure" },
  { id: "8", name: "Data Analysis", level: 62, category: "Data" },
  { id: "9", name: "SQL", level: 78, category: "Data" },
  { id: "10", name: "AWS", level: 60, category: "Infrastructure" },
];

export const mockCertificates: Certificate[] = [
  {
    id: "1",
    title: "React Developer Certification",
    issuer: "Meta",
    date: "2023-10-15",
    credentialId: "CRD-12345-ABCDE",
    credentialUrl: "https://example.com/cert/12345",
    skills: ["React", "JavaScript", "TypeScript"],
    category: "Frontend Development",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "2",
    title: "AWS Solutions Architect",
    issuer: "Amazon Web Services",
    date: "2023-08-22",
    expiryDate: "2026-08-22",
    credentialId: "AWS-SA-54321",
    credentialUrl: "https://example.com/cert/54321",
    skills: ["AWS", "Cloud Architecture", "DevOps"],
    category: "Cloud Computing",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "3",
    title: "Python for Data Science",
    issuer: "DataCamp",
    date: "2023-03-10",
    credentialId: "DC-PY-78901",
    credentialUrl: "https://example.com/cert/78901",
    skills: ["Python", "Data Analysis", "SQL"],
    category: "Data Science",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "4",
    title: "UX Design Professional",
    issuer: "Google",
    date: "2022-11-30",
    credentialId: "GGL-UX-67890",
    credentialUrl: "https://example.com/cert/67890",
    skills: ["UI/UX Design", "Figma", "User Research"],
    category: "Design",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "5",
    title: "Full-Stack JavaScript Developer",
    issuer: "Udacity",
    date: "2022-07-15",
    credentialId: "UD-FS-24680",
    credentialUrl: "https://example.com/cert/24680",
    skills: ["JavaScript", "Node.js", "React", "MongoDB"],
    category: "Full-Stack Development",
    imageUrl: "/placeholder.svg",
  }
];

export const mockUserProfile: UserProfile = {
  id: "1",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  title: "Full-Stack Developer",
  bio: "Passionate developer with a focus on creating intuitive user experiences and scalable backend solutions. Always eager to learn new technologies and methodologies.",
  location: "San Francisco, CA",
  avatarUrl: "/placeholder.svg",
  socialLinks: {
    linkedin: "https://linkedin.com/in/alexjohnson",
    github: "https://github.com/alexjohnson",
    twitter: "https://twitter.com/alexjohnson",
    website: "https://alexjohnson.dev",
  },
};
