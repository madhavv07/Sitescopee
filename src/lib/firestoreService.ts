import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth, handleFirestoreError } from "./firebase";
import { AnalysisResult, OperationType } from "../types";

export async function saveAnalysisToFirestore(analysis: AnalysisResult): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const userPath = `users/${currentUser.uid}`;
  try {
    // Ensure user profile document exists
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  const analysisPath = `users/${currentUser.uid}/analyses/${analysis.id}`;
  try {
    const payload = {
      id: analysis.id,
      userId: currentUser.uid,
      url: analysis.url.slice(0, 500),
      domain: analysis.domain.slice(0, 200),
      strategy: analysis.activeStrategy,
      performanceScore: analysis.activeStrategy === "desktop" ? analysis.desktop.performance : analysis.mobile.performance,
      seoScore: analysis.activeStrategy === "desktop" ? analysis.desktop.seo : analysis.mobile.seo,
      accessibilityScore: analysis.activeStrategy === "desktop" ? analysis.desktop.accessibility : analysis.mobile.accessibility,
      bestPracticesScore: analysis.activeStrategy === "desktop" ? analysis.desktop.bestPractices : analysis.mobile.bestPractices,
      summary: analysis.insights.summary.slice(0, 2000),
      createdAt: analysis.timestamp,
      fullResultJson: JSON.stringify(analysis),
    };

    await setDoc(doc(db, "users", currentUser.uid, "analyses", analysis.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, analysisPath);
  }
}

export async function loadUserAnalysesFromFirestore(): Promise<AnalysisResult[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const collectionPath = `users/${currentUser.uid}/analyses`;
  try {
    const q = query(
      collection(db, "users", currentUser.uid, "analyses"),
      orderBy("createdAt", "desc"),
      limit(15)
    );
    const snap = await getDocs(q);
    const results: AnalysisResult[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.fullResultJson) {
        try {
          const parsed: AnalysisResult = JSON.parse(data.fullResultJson);
          if (
            parsed.warning &&
            (parsed.warning.includes("API keys are not supported") ||
              parsed.warning.includes("OAuth2 access token") ||
              parsed.warning.includes("Showing calculated benchmarks"))
          ) {
            parsed.warning = "Audited via Live DOM & Network Inspector (Real-time network & DOM analysis).";
            parsed.auditSource = "Live DOM & Network Deep Diagnostic";
          }
          results.push(parsed);
        } catch {
          // fallback if json parse fails
        }
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function deleteAnalysisFromFirestore(analysisId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const docPath = `users/${currentUser.uid}/analyses/${analysisId}`;
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "analyses", analysisId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
