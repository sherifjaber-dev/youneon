"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  followUser,
  personFromFollow,
  subscribeToFollowers,
  subscribeToFollowing,
  subscribeToOnlineMap,
  unfollowUser,
  type FollowPerson,
  type FollowSnapshot,
} from "@/lib/follow-service";
import { getUserProfile } from "@/lib/firestore-service";

function mergeLive(person: FollowPerson, live: FollowPerson | undefined): FollowPerson {
  if (!live) return person;
  return {
    id: person.id,
    name: live.name || person.name,
    photo: live.photo || person.photo,
    country: live.country || person.country,
    age: live.age || person.age,
  };
}

export function useFollowGraph(userId?: string) {
  const [followingRows, setFollowingRows] = useState<FollowPerson[]>([]);
  const [followerRows, setFollowerRows] = useState<FollowPerson[]>([]);
  const [liveById, setLiveById] = useState<Record<string, FollowPerson>>({});
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFollowingRows([]);
      setFollowerRows([]);
      return;
    }
    const unsubFollow = subscribeToFollowing(userId, (rows) => {
      setFollowingRows(rows.map((r) => personFromFollow(r, userId)));
    });
    const unsubFollowers = subscribeToFollowers(userId, (rows) => {
      setFollowerRows(rows.map((r) => personFromFollow(r, userId)));
    });
    return () => {
      unsubFollow();
      unsubFollowers();
    };
  }, [userId]);

  const idsKey = useMemo(() => {
    const ids = [...followingRows, ...followerRows].map((p) => p.id);
    return [...new Set(ids)].sort().join(",");
  }, [followingRows, followerRows]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",").filter(Boolean) : [];
    if (ids.length === 0) {
      setLiveById({});
      return;
    }
    let cancelled = false;
    Promise.all(
      ids.slice(0, 40).map(async (id) => {
        const profile = await getUserProfile(id).catch(() => null);
        if (!profile) return null;
        return {
          id,
          name: profile.fullName || id,
          photo: profile.profilePicture || profile.photos?.[0] || "",
          country: profile.country || profile.location || "",
          age: typeof profile.age === "number" && profile.age > 0 ? profile.age : undefined,
        } as FollowPerson;
      })
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, FollowPerson> = {};
      rows.forEach((row) => {
        if (row) next[row.id] = row;
      });
      setLiveById(next);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",").filter(Boolean) : [];
    const unsub = subscribeToOnlineMap(ids, setOnline);
    return () => unsub();
  }, [idsKey]);

  const following = useMemo(
    () => followingRows.map((p) => mergeLive(p, liveById[p.id])),
    [followingRows, liveById]
  );
  const followers = useMemo(
    () => followerRows.map((p) => mergeLive(p, liveById[p.id])),
    [followerRows, liveById]
  );
  const followingIds = useMemo(() => new Set(following.map((p) => p.id)), [following]);

  const follow = useCallback(
    async (me: FollowSnapshot, other: FollowSnapshot) => {
      if (!other.id || busyId) return;
      setBusyId(other.id);
      try {
        await followUser(me, other);
      } catch (e) {
        console.warn("follow failed", e);
      } finally {
        setBusyId(null);
      }
    },
    [busyId]
  );

  const unfollow = useCallback(
    async (meId: string, otherId: string) => {
      if (!otherId || busyId) return;
      setBusyId(otherId);
      try {
        await unfollowUser(meId, otherId);
      } catch (e) {
        console.warn("unfollow failed", e);
      } finally {
        setBusyId(null);
      }
    },
    [busyId]
  );

  const toggleFollow = useCallback(
    async (me: FollowSnapshot, other: FollowSnapshot) => {
      if (!me.id || !other.id) return;
      if (followingIds.has(other.id)) await unfollow(me.id, other.id);
      else await follow(me, other);
    },
    [follow, unfollow, followingIds]
  );

  return {
    following,
    followers,
    followingIds,
    online,
    busyId,
    follow,
    unfollow,
    toggleFollow,
    isFollowing: (id: string) => followingIds.has(id),
  };
}
