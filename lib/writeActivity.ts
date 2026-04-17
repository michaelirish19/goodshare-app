import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type ActivityType =
  | "new_pick"
  | "badge_earned"
  | "rating_received"
  | "new_sharer";

type ActivityPayload = {
  pickTitle?: string;
  pickId?: string;
  badgeLabel?: string;
  badgeEmoji?: string;
};

export async function writeActivity(
  type: ActivityType,
  recommenderId: string,
  recommenderName: string,
  payload: ActivityPayload = {}
) {
  console.log("writeActivity called:", type, recommenderId, recommenderName);
  try {
    await addDoc(collection(db, "activity"), {
      type,
      recommenderId,
      recommenderName,
      payload,
      createdAt: serverTimestamp(),
    });
    console.log("writeActivity succeeded");
  } catch (err) {
    console.error("Activity write failed:", err);
  }
}