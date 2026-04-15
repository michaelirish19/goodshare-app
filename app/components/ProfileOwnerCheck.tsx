"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import RecommendationFilter from "./RecommendationFilter";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
};

type Props = {
  profileUserId?: string;
  recommenderId: string;
  recommendations: Recommendation[];
  categories: string[];
  recommenderName: string;
};

export default function ProfileOwnerCheck({
  profileUserId,
  recommenderId,
  recommendations,
  categories,
  recommenderName,
}: Props) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsOwner(!!user && user.uid === profileUserId);
    });
    return () => unsubscribe();
  }, [profileUserId]);

  return (
    <RecommendationFilter
      recommendations={recommendations}
      recommenderId={recommenderId}
      profileUserId={profileUserId}
      categories={categories}
      isOwner={isOwner}
      recommenderName={recommenderName}
    />
  );
}