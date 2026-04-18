import { addDoc, collection, doc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
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
  try {
    await addDoc(collection(db, "activity"), {
      type,
      recommenderId,
      recommenderName,
      payload,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Activity write failed:", err);
  }
}

async function incrementStat(field: string, amount = 1) {
  try {
    const ref = doc(db, "stats", "global");
    await updateDoc(ref, { [field]: increment(amount) });
  } catch {
    // Document might not exist yet — create it
    try {
      const ref = doc(db, "stats", "global");
      await setDoc(ref, { [field]: amount }, { merge: true });
    } catch (err) {
      console.error("Stat increment failed:", err);
    }
  }
}

export async function incrementPickCount() {
  await incrementStat("totalPicks");
}

export async function incrementSharerCount() {
  await incrementStat("totalSharers");
}

export async function incrementClickCount(amount = 1) {
  await incrementStat("totalClicks", amount);
}