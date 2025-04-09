import React, { useMemo, useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { CertificateCard } from "@/components/CertificateCard";
import AddCertificateForm from "@/components/AddCertificateForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SortAsc, RefreshCw, Filter, X, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Predefined categories for filter
const PREDEFINED_CATEGORIES = [
  "All Categories",
  "Web Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Data Science",
  "Data Engineering",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "UI/UX Design",
  "Mobile Development",
  "DevOps",
  "Blockchain",
  "IoT",
  "Game Development",
  "Digital Marketing",
  "Project Management",
  "Business Analytics",
  "Network Engineering",
  "Software Engineering", 
  "Java Development",
  "Python Development",
  "JavaScript Development",
  "Other"
];

const CertificatesPage: React.FC = () => {
  const { certificates, loading, refreshData } = useAppContext();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterIssuer, setFilterIssuer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setFilterCategory("All Categories");
    setFilterIssuer("all");
    setFilterStatus("all");
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== "All Categories") count++;
    if (filterIssuer !== "all") count++;
    if (filterStatus !== "all") count++;
    if (search) count++;
    return count;
  }, [filterCategory, filterIssuer, filterStatus, search]);

  // Categories from certificates
  const certificateCategories = useMemo(() => {
    const uniqueCategories = new Set(certificates.map((cert) => cert.category));
    return Array.from(uniqueCategories);
  }, [certificates]);

  // Issuers from certificates
  const issuers = useMemo(() => {
    const uniqueIssuers = new Set(certificates.map((cert) => cert.issuer));
    return ["all", ...Array.from(uniqueIssuers)];
  }, [certificates]);

  // Check if certificate is expired
  const isCertificateExpired = (cert: any) => {
    if (!cert.expiryDate) return false;
    const expiryDate = new Date(cert.expiryDate);
    return expiryDate < new Date();
  };

  // Filtered and sorted certificates
  const filteredAndSortedCertificates = useMemo(() => {
    let filtered = certificates.filter((cert) => {
      // Search in title, issuer, and skills
      const searchMatch = 
        search === "" || 
        cert.title.toLowerCase().includes(search.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(search.toLowerCase()) ||
        cert.skills.some((skill) => 
          skill.toLowerCase().includes(search.toLowerCase())
        );

      // Filter by category
      const categoryMatch = 
        filterCategory === "All Categories" || 
        cert.category.toLowerCase() === filterCategory.toLowerCase();

      // Filter by issuer
      const issuerMatch = 
        filterIssuer === "all" || 
        cert.issuer === filterIssuer;

      // Filter by status
      const isExpired = isCertificateExpired(cert);
      const statusMatch = 
        filterStatus === "all" || 
        (filterStatus === "active" && !isExpired) ||
        (filterStatus === "expired" && isExpired);

      return searchMatch && categoryMatch && issuerMatch && statusMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else {
        return a.issuer.localeCompare(b.issuer);
      }
    });
  }, [certificates, search, sortBy, filterCategory, filterIssuer, filterStatus]);

  // Initial data load on mount (just to be double sure)
  useEffect(() => {
    // Create a flag in localStorage to prevent infinite refresh
    const hasAttemptedInitialLoad = localStorage.getItem('certificates_initial_load_attempted');
    
    if (!loading.certificates && certificates.length === 0 && !hasAttemptedInitialLoad) {
      // Set the flag before attempting to refresh
      localStorage.setItem('certificates_initial_load_attempted', 'true');
      refreshData();
    }
  }, [loading.certificates, certificates, refreshData]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Certificates</h1>
          <p className="text-muted-foreground">
            Manage and showcase your professional certificates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <AddCertificateForm />
        </div>
      </div>

      {/* Search and filter section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 sm:flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            
            <Select onValueChange={setSortBy} value={sortBy}>
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="issuer">Issuer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Advanced filters */}
        {showFilters && (
          <div className="p-4 border rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select onValueChange={setFilterCategory} value={filterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {PREDEFINED_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    
                    {/* Add any unique categories from certificates that aren't in the predefined list */}
                    {certificateCategories
                      .filter(cat => !PREDEFINED_CATEGORIES.includes(cat))
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Issuer</label>
                <Select onValueChange={setFilterIssuer} value={filterIssuer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Issuers" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Issuers</SelectItem>
                    {issuers
                      .filter(issuer => issuer !== "all")
                      .map((issuer) => (
                        <SelectItem key={issuer} value={issuer}>
                          {issuer}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select onValueChange={setFilterStatus} value={filterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate cards */}
      {loading.certificates ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p>Loading certificates...</p>
          </div>
        </div>
      ) : filteredAndSortedCertificates.length === 0 ? (
        <div className="text-center py-12">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-muted-foreground/50 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" 
                />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Certificates Available</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't added any certificates to your profile yet. Showcase your skills by adding your certifications!
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm inline-flex items-center">
                <span className="mr-2">💡</span>
                Use the <span className="font-semibold mx-1">Add Certificate</span> button in the top right to get started.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-muted-foreground/50 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" 
                />
              </svg>
              <p className="text-muted-foreground mb-3">
                No certificates match your search and filter criteria.
              </p>
              <Button 
                variant="link" 
                onClick={resetFilters}
                className="mt-1"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Result count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredAndSortedCertificates.length} of {certificates.length} certificates
          </p>
          
          {/* Certificate grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedCertificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
