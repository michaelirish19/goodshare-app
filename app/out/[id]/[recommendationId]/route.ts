import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
    recommendationId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  let targetUrl = "";

  try {
    const { id, recommendationId } = await context.params;

    const recommenderRef = adminDb.collection("recommenders").doc(id);
    const recommendationRef = recommenderRef
      .collection("recommendations")
      .doc(recommendationId);

    const recommendationSnap = await recommendationRef.get();

    if (!recommendationSnap.exists) {
      return NextResponse.redirect(
        new URL(`/recommenders/${id}`, request.url),
        { status: 302 }
      );
    }

    const recommendation = recommendationSnap.data() as {
      link?: string;
      affiliateLink?: string;
      title?: string;
      category?: string;
    };

    const rawTargetUrl = recommendation.affiliateLink || recommendation.link;

    if (!rawTargetUrl) {
      return NextResponse.redirect(
        new URL(`/recommenders/${id}/recommendations/${recommendationId}`, request.url),
        { status: 302 }
      );
    }

    targetUrl =
      rawTargetUrl.startsWith("http://") || rawTargetUrl.startsWith("https://")
        ? rawTargetUrl
        : `https://${rawTargetUrl}`;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;

    try {
      const clickRef = adminDb.collection("outboundClicks").doc();
      const batch = adminDb.batch();

      batch.set(clickRef, {
        recommenderId: id,
        recommendationId,
        targetUrl,
        recommendationTitle: recommendation.title || null,
        category: recommendation.category || null,
        userAgent,
        referer,
        ip,
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.update(recommendationRef, {
        outboundClickCount: FieldValue.increment(1),
        lastOutboundClickAt: FieldValue.serverTimestamp(),
      });

      batch.update(recommenderRef, {
        totalOutboundClickCount: FieldValue.increment(1),
        lastOutboundClickAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
    } catch (loggingError) {
      console.error("Outbound click logging failed:", loggingError);
    }

    return NextResponse.redirect(new URL(targetUrl), { status: 302 });
   } catch (error) {
    console.error("Outbound redirect failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Outbound redirect failed",
        targetUrl,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}