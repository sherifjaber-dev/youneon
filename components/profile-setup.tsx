"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

interface ProfileSetupProps {
  onComplete: (profile: UserProfileData) => void;
}

export interface UserProfileData {
  nickname: string;
  age: number;
  gender: string;
  country: string;
  bio: string;
  interests: string[];
  profileImage?: string;
}

const INTERESTS_OPTIONS = [
  "Travel",
  "Gaming",
  "Music",
  "Language Exchange",
  "Dating",
  "Friends",
  "Sports",
  "Art",
  "Technology",
  "Business",
  "Fitness",
  "Cooking",
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "India",
  "Brazil",
  "Australia",
  "Mexico",
  "Other",
];

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState(18);
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("United States");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (!nickname.trim()) {
      alert("Please enter a nickname");
      return;
    }
    if (interests.length === 0) {
      alert("Please select at least one interest");
      return;
    }

    onComplete({
      nickname,
      age,
      gender,
      country,
      bio,
      interests,
      profileImage: profileImage || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-b from-background to-background/95 p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Complete Your Profile</h2>
          <p className="text-muted-foreground">
            Step {step} of 4 • Create your PiAzar profile
          </p>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Choose a nickname"
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Age</label>
              <input
                type="number"
                min="13"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {["male", "female", "other"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGender(opt)}
                    className={`py-2 px-3 rounded-lg font-medium transition ${
                      gender === opt
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Bio */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself (optional)"
                rows={4}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bio.length}/150 characters
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select your interests (at least 1)
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                    interests.includes(interest)
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Profile Picture */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add a profile picture (optional)
            </p>
            <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-blue-500 cursor-pointer transition">
              <div className="text-center">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-lg object-cover mx-auto mb-4"
                    />
                    <p className="text-sm font-medium">Change photo</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload a photo</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or GIF
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground text-center">
              Use a friendly, clear photo of yourself
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex-1 py-3 rounded-xl font-semibold"
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => {
                if (step === 1 && !nickname) {
                  alert("Please enter a nickname");
                  return;
                }
                setStep(step + 1);
              }}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              Complete Setup
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
