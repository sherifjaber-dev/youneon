import { useState, useEffect } from "react";

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: "pending" | "accepted" | "blocked";
  lastMessage?: string;
  hasReplied: boolean; // Has this friend replied to at least one message
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  friendId: string;
  friendName: string;
  messages: Message[];
  canStartCall: boolean; // Friend accepted AND has replied to at least one message
}

export function useFriendsMessaging() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});

  // Load friends and conversations from localStorage
  useEffect(() => {
    const savedFriends = localStorage.getItem("youneon_friends");
    const savedConversations = localStorage.getItem("youneon_conversations");

    if (savedFriends) setFriends(JSON.parse(savedFriends));
    if (savedConversations) setConversations(JSON.parse(savedConversations));
  }, []);

  // Save friends to localStorage
  useEffect(() => {
    localStorage.setItem("youneon_friends", JSON.stringify(friends));
  }, [friends]);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem("youneon_conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Add or request a friend
  const addFriend = (friend: Friend) => {
    const exists = friends.find((f) => f.id === friend.id);
    if (!exists) {
      setFriends([...friends, { ...friend, status: "pending", hasReplied: false }]);
    }
  };

  // Accept a friend request
  const acceptFriend = (friendId: string) => {
    setFriends(
      friends.map((f) =>
        f.id === friendId ? { ...f, status: "accepted" } : f
      )
    );
  };

  // Send a message
  const sendMessage = (friendId: string, senderName: string, content: string) => {
    const message: Message = {
      id: Math.random().toString(36),
      senderId: "user", // In real app, this would be the logged-in user ID
      senderName: senderName,
      content,
      timestamp: Date.now(),
    };

    setConversations((prev) => ({
      ...prev,
      [friendId]: {
        friendId,
        friendName: prev[friendId]?.friendName || "Friend",
        messages: [...(prev[friendId]?.messages || []), message],
        canStartCall: prev[friendId]?.canStartCall || false,
      },
    }));
  };

  // Receive a message (simulating friend reply)
  const receiveMessage = (friendId: string, friendName: string, content: string) => {
    const message: Message = {
      id: Math.random().toString(36),
      senderId: friendId,
      senderName: friendName,
      content,
      timestamp: Date.now(),
    };

    setConversations((prev) => ({
      ...prev,
      [friendId]: {
        friendId,
        friendName,
        messages: [...(prev[friendId]?.messages || []), message],
        canStartCall: prev[friendId]?.canStartCall || false,
      },
    }));

    // Mark friend as has replied
    setFriends(
      friends.map((f) =>
        f.id === friendId ? { ...f, hasReplied: true } : f
      )
    );
  };

  // Check if can start video call with friend
  const canStartVideoCall = (friendId: string): boolean => {
    const friend = friends.find((f) => f.id === friendId);
    if (!friend || friend.status !== "accepted") return false;

    if (!friend.hasReplied) return false;

    return true;
  };

  // Get accepted friends
  const getAcceptedFriends = (): Friend[] => {
    return friends.filter((f) => f.status === "accepted");
  };

  // Get pending friend requests
  const getPendingFriends = (): Friend[] => {
    return friends.filter((f) => f.status === "pending");
  };

  return {
    friends,
    conversations,
    addFriend,
    acceptFriend,
    sendMessage,
    receiveMessage,
    canStartVideoCall,
    getAcceptedFriends,
    getPendingFriends,
  };
}
