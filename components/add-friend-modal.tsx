import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import { CountryLabel } from "@/components/country-flag";
import { useFriendsMessaging } from "@/hooks/use-friends-messaging";
import type { Friend } from "@/hooks/use-friends-messaging";

interface AddFriendModalProps {
  matchedUser: {
    nickname: string;
    age: number;
    country: string;
  };
  onClose: () => void;
  onContinue: () => void;
}

export function AddFriendModal({ matchedUser, onClose, onContinue }: AddFriendModalProps) {
  const { addFriend } = useFriendsMessaging();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddFriend = () => {
    setIsAdding(true);
    
    const newFriend: Friend = {
      id: Math.random().toString(36),
      name: matchedUser.nickname,
      avatar: "👤",
      status: "pending",
      hasReplied: false,
    };

    addFriend(newFriend);

    setTimeout(() => {
      setIsAdding(false);
      onContinue();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="yn-card rounded-3xl p-8 max-w-sm w-full">
        <div className="text-center">
          <div className="w-20 h-20 neon-gradient-bg rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-fuchsia-500/25">
            👤
          </div>

          <h2 className="text-2xl font-bold neon-gradient-text mb-2">
            {matchedUser.nickname}
          </h2>
          <p className="mb-6 flex flex-wrap items-center justify-center gap-x-2 text-yn-muted">
            <span>{matchedUser.age} years old</span>
            {matchedUser.country ? (
              <>
                <span>•</span>
                <CountryLabel country={matchedUser.country} size={18} />
              </>
            ) : null}
          </p>

          <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yn-muted">
              Add {matchedUser.nickname} as a friend to start messaging and enable video calls!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-black/10 text-yn-muted hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              <X size={18} className="mr-2" />
              Skip
            </Button>
            <Button
              onClick={handleAddFriend}
              disabled={isAdding}
              className="flex-1 neon-button"
            >
              <UserPlus size={18} className="mr-2" />
              {isAdding ? "Adding..." : "Add Friend"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
