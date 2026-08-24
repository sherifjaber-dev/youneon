"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export interface MatchFilters {
  gender: string;
  ageMin: number;
  ageMax: number;
  country: string;
  interests: string[];
}

interface FiltersScreenProps {
  onClose: () => void;
  onApply: (filters: MatchFilters) => void;
  initialFilters?: MatchFilters;
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
  "All",
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
  "Other",
];

export function FiltersScreen({
  onClose,
  onApply,
  initialFilters,
}: FiltersScreenProps) {
  const [gender, setGender] = useState(initialFilters?.gender || "all");
  const [ageMin, setAgeMin] = useState(initialFilters?.ageMin || 18);
  const [ageMax, setAgeMax] = useState(initialFilters?.ageMax || 65);
  const [country, setCountry] = useState(initialFilters?.country || "All");
  const [interests, setInterests] = useState<string[]>(
    initialFilters?.interests || []
  );

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleApply = () => {
    onApply({
      gender,
      ageMin,
      ageMax,
      country,
      interests,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <Card className="w-full rounded-t-3xl bg-gradient-to-b from-background to-background/95 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {["all", "male", "female"].map((opt) => (
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

          {/* Age Range Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Age Range: {ageMin} - {ageMax}
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="range"
                  min="13"
                  max="100"
                  value={ageMin}
                  onChange={(e) => setAgeMin(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">Min Age</span>
              </div>
              <div>
                <input
                  type="range"
                  min="13"
                  max="100"
                  value={ageMax}
                  onChange={(e) => setAgeMax(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">Max Age</span>
              </div>
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Interests Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">Interests</label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                    interests.includes(interest)
                      ? "bg-blue-500 text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="py-6 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="py-6 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </Card>
    </div>
  );
}
