"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Props = {
  recommenderId: string;
};

export default function FollowerStats({ recommenderId }: Props) {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const ref = doc(db, "recommenders", recommenderId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFollowerCount(data.followerCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
      }
    });
    return () => unsubscribe();
  }, [recommenderId]);

  return (
    <div className="flex gap-4">
      <div className="text-center">
        <p className="text-lg font-bold">{followerCount}</p>
        <p className="text-xs text-gray-500">Followers</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold">{followingCount}</p>
        <p className="text-xs text-gray-500">Following</p>
      </div>
    </div>
  );
}