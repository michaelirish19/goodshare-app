"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import OnboardingChecklist from "./OnboardingChecklist";

type Props = {
  profileUserId?: string;
  recommenderId: string;
  recommendationCount: number;
  totalOutboundClickCount: number;
  totalRatings: number;
};

export default function OwnerOnlyChecklist({
  profileUserId,
  recommenderId,
  recommendationCount,
  totalOutboundClickCount,
  totalRatings,
}: Props) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsOwner(!!user && user.uid === profileUserId);
    });
    return () => unsubscribe();
  }, [profileUserId]);

  if (!isOwner) return null;

  return (
    <OnboardingChecklist
      recommenderId={recommenderId}
      recommendationCount={recommendationCount}
      totalOutboundClickCount={totalOutboundClickCount}
      totalRatings={totalRatings}
    />
  );
}