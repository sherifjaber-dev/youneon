"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { CountryLabel } from "@/components/country-flag";
import { UserPhoto } from "@/components/neon-avatar";

interface UserProfile {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  photos: string[];
  bio?: string;
  interests?: string[];
  languages?: string[];
  giftsReceived?: Array<{ emoji: string; from: string; name: string }>;
}

interface ViewProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onMessage: (userId: string) => void;
  onAddFriend: (userId: string) => void;
}

export function ViewProfileModal({ isOpen, user, onClose, onMessage, onAddFriend }: ViewProfileModalProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white p-3">
        <X size={28} />
      </button>

      {/* Photo Carousel */}
      <div className="relative h-96 bg-black">
        {user.photos?.length > 0 ? (
          <UserPhoto
            src={user.photos[currentPhoto]}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserPhoto alt={user.name} className="w-full h-full object-cover" />
        )}

        {user.photos?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {user.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentPhoto ? "bg-white w-6" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        <div>
          <h1 className="text-4xl font-bold text-white">{user.name}</h1>
          <p className="text-xl text-purple-300">
            <CountryLabel country={user.countryFlag || user.country} name={user.country} size={20} />
          </p>
        </div>

        {user.bio && (
          <div>
            <h3 className="text-sm uppercase tracking-widest text-purple-400 mb-2">Bio</h3>
            <p className="text-white/90 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Gifts Received */}
        {user.giftsReceived && user.giftsReceived.length > 0 && (
          <div>
            <h3 className="text-sm uppercase tracking-widest text-purple-400 mb-3">Gifts Received</h3>
            <div className="flex flex-wrap gap-4">
              {user.giftsReceived.map((gift, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl mb-1">{gift.emoji}</div>
                  <p className="text-xs text-white/70">from {gift.from}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
        <div className="flex gap-3">
          <button
            onClick={() => onMessage(user.id)}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          >
            <MessageCircle size={22} />
            Message
          </button>

          <button
            onClick={() => onAddFriend(user.id)}
            className="flex-1 py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <UserPlus size={22} />
            Add Friend
          </button>
        </div>
      </div>
    </div>
  );
}