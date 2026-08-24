"use client";
import { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus, Edit2, MapPin } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  fullName: string;
  age: number;
  country: string;
  languages: string[];
  interests: string[];
  profilePicture: string;
  bio?: string;
  location?: string;
}

const INTEREST_OPTIONS = [
  "Travel", "Gaming", "Music", "Language Exchange", "Dating", "Friends", "Sports",
  "Books", "Movies", "Art", "Technology", "Cooking", "Photography", "Hiking",
  "Yoga", "Fitness", "Fashion", "Design", "Business", "Education"
];

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [reactionsReceived, setReactionsReceived] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);

  const REACTION_LIST = [
    { name: "Awesome", emoji: "👍" },
    { name: "Funny", emoji: "😂" },
    { name: "Friendly", emoji: "🙌" },
    { name: "WOW", emoji: "😲" },
    { name: "Magic Rabbit", emoji: "🪄" },
    { name: "Charming", emoji: "❤️" },
    { name: "Rose", emoji: "🌹" },
  ];

  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const stored = localStorage.getItem("youneon_user_profile");
        if (stored) {
          const profileData = JSON.parse(stored);
          setProfile(profileData);
          setFormData(profileData);
          if (profileData.profilePicture) {
            setPhotos([profileData.profilePicture]);
          }
        }

        const reactions = localStorage.getItem("youneon_reactions_received");
        if (reactions) {
          setReactionsReceived(JSON.parse(reactions));
        }
      }
    } catch (e) {
      console.error("[v0] Error loading profile:", e);
    }
  }, []);

  const handleSave = () => {
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const updated = { ...profile, ...formData };
        localStorage.setItem("youneon_user_profile", JSON.stringify(updated));
        setProfile(updated);
        setEditingField(null);
      }
    } catch (e) {
      console.error("[v0] Error saving profile:", e);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPhotos([...photos, base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetMainPhoto = (index: number) => {
    setMainPhotoIndex(index);
    setFormData({ ...formData, profilePicture: photos[index] });
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (mainPhotoIndex === index && newPhotos.length > 0) {
      setMainPhotoIndex(0);
      setFormData({ ...formData, profilePicture: newPhotos[0] });
    }
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = formData.interests || [];
    const updated = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    setFormData({ ...formData, interests: updated });
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h1 className="text-2xl font-black text-gray-900">Edit Profile</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Photos & Videos */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📸</span> Photos & Videos
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    mainPhotoIndex === index
                      ? "border-gradient-to-r from-purple-500 to-pink-500 ring-2 ring-purple-500"
                      : "border-gray-300 hover:border-purple-400"
                  }`}
                >
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleSetMainPhoto(index)}
                      className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded hover:bg-purple-600"
                    >
                      Main
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(index)}
                      className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-purple-400 flex items-center justify-center cursor-pointer hover:bg-purple-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <Plus size={32} className="text-purple-600 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-purple-600">Add Photo</span>
                </div>
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-900">Name</label>
              {editingField !== "fullName" && (
                <button
                  onClick={() => setEditingField("fullName")}
                  className="text-purple-600 hover:text-pink-600 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
            {editingField === "fullName" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="flex-1 px-4 py-2 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-600">{profile?.fullName}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-900">Age</label>
              {editingField !== "age" && (
                <button
                  onClick={() => setEditingField("age")}
                  className="text-purple-600 hover:text-pink-600 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
            {editingField === "age" ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="flex-1 px-4 py-2 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-600">{profile?.age} years old</p>
            )}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                <MapPin size={16} /> Location
              </label>
              {editingField !== "location" && (
                <button
                  onClick={() => setEditingField("location")}
                  className="text-purple-600 hover:text-pink-600 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
            {editingField === "location" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="flex-1 px-4 py-2 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your location"
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-600">{formData.location || profile?.country || "Not set"}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-900">Bio</label>
              {editingField !== "bio" && (
                <button
                  onClick={() => setEditingField("bio")}
                  className="text-purple-600 hover:text-pink-600 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
            {editingField === "bio" ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="flex-1 px-4 py-2 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-24"
                  placeholder="Tell others about yourself..."
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-600">{formData.bio || "No bio yet"}</p>
            )}
          </div>

          {/* Interests */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>⚡</span> Interests
            </h2>
            {editingField === "interests" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        (formData.interests || []).includes(interest)
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-gray-100 text-gray-900 hover:border-purple-400"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    handleSave();
                    setEditingField(null);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formData.interests || []).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setEditingField("interests")}
                  className="text-purple-600 hover:text-pink-600 text-sm font-semibold"
                >
                  Edit your interests
                </button>
              </div>
            )}
          </div>

          {/* Reactions Received */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>💫</span> Reactions Received
            </h2>
            {Object.keys(reactionsReceived).length > 0 ? (
              <div className="space-y-2">
                {REACTION_LIST.map((reaction) => {
                  const count = reactionsReceived[reaction.name] || 0;
                  return count > 0 ? (
                    <div key={reaction.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{reaction.emoji}</span>
                        <span className="text-sm font-medium text-gray-900">{reaction.name}</span>
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">{count}</span>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No reactions yet. Start chatting to receive reactions!</p>
            )}
          </div>

          {/* Azar Badge */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <div>
                <p className="font-bold text-gray-900">Azar Badge</p>
                <p className="text-sm text-gray-600">Verified & trusted member</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
