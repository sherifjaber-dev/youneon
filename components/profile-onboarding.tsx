"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown, ArrowLeft, Upload } from "lucide-react";
import { piAuthService } from "@/lib/pi-auth-service";

const COUNTRIES = [
  "Denmark", "Sweden", "Norway", "Finland", "Germany", "France", "Spain", "Italy",
  "United States", "Canada", "United Kingdom", "Netherlands", "Belgium", "Poland",
  "Ukraine", "Russia", "Turkey", "India", "Thailand", "Japan", "South Korea", "Brazil"
].sort();

const LANGUAGES = ["English", "Danish", "Swedish", "Norwegian", "German", "French", "Spanish", "Italian", "Arabic", "Russian"];

const INTERESTS = ["Music", "Travel", "Gaming", "Sports", "Movies", "Food", "Technology", "Fitness", "Art", "Photography", "Reading", "Cooking"];

interface ProfileData {
  fullName: string;
  age: number | "";
  country: string;
  languages: string[];
  interests: string[];
  profilePicture?: string;
}

interface ProfileOnboardingProps {
  onComplete: (data: ProfileData) => void;
  onBack?: () => void;
  isEditing?: boolean;
}

export function ProfileOnboarding({ onComplete, onBack, isEditing }: ProfileOnboardingProps) {
  const [formData, setFormData] = useState<ProfileData>({
    fullName: "",
    age: "",
    country: "",
    languages: [],
    interests: [],
    profilePicture: undefined
  });

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Load existing profile data if editing
  useEffect(() => {
    if (isEditing) {
      const existingProfile = piAuthService.loadProfile();
      if (existingProfile) {
        setFormData({
          fullName: existingProfile.fullName,
          age: existingProfile.age || "",
          country: existingProfile.country,
          languages: existingProfile.languages,
          interests: existingProfile.interests,
          profilePicture: existingProfile.profilePicture
        });
      }
    }
  }, [isEditing]);

  const filteredCountries = COUNTRIES.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, profilePicture: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) return formData.profilePicture !== undefined && formData.fullName.trim() !== "" && formData.age !== "" && Number(formData.age) >= 18;
    if (currentStep === 1) return formData.country !== "";
    if (currentStep === 2) return formData.languages.length > 0;
    if (currentStep === 3) return formData.interests.length > 0;
    return false;
  };

  const handleNextStep = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (isStepValid()) {
      try {
        
        // Save profile to Pi auth service
        const piUser = piAuthService.getCurrentUser();
        if (piUser) {
          const profileData = {
            piUsername: piUser.username,
            fullName: formData.fullName,
            age: Number(formData.age),
            country: formData.country,
            languages: formData.languages,
            interests: formData.interests,
            profilePicture: formData.profilePicture,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          piAuthService.saveProfile(profileData);
          
          // Small delay to ensure save completes
          await new Promise(r => setTimeout(r, 100));
          
          onComplete(formData);
        } else {
          onComplete(formData);
        }
      } catch (e) {
        console.error("Error saving profile:", e);
        // Still complete even if save fails
        onComplete(formData);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-yn-bg flex flex-col">
      {/* Header */}
      <div className="px-4 py-8 text-center border-b border-black/6 relative">
        {(currentStep > 0 || isEditing) && (
          <button
            onClick={handlePrevStep}
            className="absolute left-4 top-8 p-2 rounded-lg hover:bg-black/5 transition-colors text-yn-muted hover:text-yn-text"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-4xl font-bold text-yn-text mb-2">YouNeon</h1>
        <p className="text-yn-muted">{isEditing ? "Edit your profile" : "Complete your profile"}</p>
      </div>

      <div className="flex-1 px-4 py-8">
        {/* Step 0: Profile Picture + Name + Age */}
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-2xl shadow-purple-500/60 border-2 border-purple-300/50">
                {formData.profilePicture ? (
                  <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">📷</span>
                )}
              </div>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="px-4 py-2 rounded-lg bg-fuchsia-50 border border-fuchsia-200 hover:border-pink-300 hover:bg-pink-50 transition-all flex items-center gap-2 text-yn-accent hover:text-yn-accent-2 font-medium cursor-pointer">
                  <Upload size={18} />
                  Upload Photo
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-yn-muted mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="bg-white border-fuchsia-200 text-yn-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yn-muted mb-2">Age (must be 18+)</label>
              <Input
                type="number"
                placeholder="Your age"
                min="18"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value ? parseInt(e.target.value) : "")}
                className="bg-white border-fuchsia-200 text-yn-text"
              />
            </div>
          </div>
        )}

        {/* Step 1: Country */}
        {currentStep === 1 && (
          <div>
            <label className="block text-sm font-medium text-yn-muted mb-2">Where are you from?</label>
            <div className="relative">
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-4 py-3 bg-yn-card border border-black/10 rounded-lg text-left flex justify-between items-center text-yn-text"
              >
                <span>{formData.country || "Select country"}</span>
                <ChevronDown size={20} />
              </button>

              {countryDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-yn-card border border-black/10 rounded-lg shadow-xl max-h-80 overflow-auto">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-4 py-3 bg-yn-card border-b border-black/8 text-yn-text placeholder:text-yn-muted"
                  />
                  {filteredCountries.map((country) => (
                    <div
                      key={country}
                      onClick={() => {
                        handleInputChange("country", country);
                        setCountryDropdownOpen(false);
                      }}
                      className="px-4 py-3 hover:bg-fuchsia-50 cursor-pointer text-yn-text"
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Languages */}
        {currentStep === 2 && (
          <div>
            <label className="block text-sm font-medium text-yn-muted mb-3">Languages you speak</label>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.languages.includes(lang)
                      ? "bg-[var(--pink)] text-white border-[var(--pink)]"
                      : "bg-yn-card border-black/10 text-yn-muted hover:border-pink-300"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {currentStep === 3 && (
          <div>
            <label className="block text-sm font-medium text-yn-muted mb-3">Your interests</label>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.interests.includes(interest)
                      ? "bg-[var(--pink)] text-white border-[var(--pink)]"
                      : "bg-yn-card border-black/10 text-yn-muted hover:border-pink-300"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-purple-500/30 flex gap-3">
        {(currentStep > 0 || isEditing) && (
          <Button onClick={handlePrevStep} variant="outline" className="flex-1">
            Back
          </Button>
        )}
        <Button
          onClick={handleNextStep}
          disabled={!isStepValid()}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {currentStep === 3 ? "Save Profile & Continue" : "Next"}
        </Button>
      </div>
    </div>
  );
}
