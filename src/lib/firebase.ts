import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create DB and Auth instances
// Supporting dynamic database IDs if specified, otherwise fall back to standard
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// Test connection on boot according to firestore-integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// Structured Firestore error logging as per guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function sanitizePlanForFirestore(plan: any, userId?: string): any {
  if (!plan) return plan;
  
  const serializedPlanData = JSON.stringify(plan);
  
  try {
    const size = new Blob([serializedPlanData]).size;
    console.log("PLAN SIZE BYTES:", size);
  } catch (e) {
    console.warn("Blob check failed, falling back to string length", e);
    console.log("PLAN SIZE BYTES:", serializedPlanData.length);
  }
  
  return {
    id: plan.id || '',
    userId: userId || plan.userId || 'anonymous',
    clientName: plan.clientName || '',
    locality: plan.locality || '',
    district: plan.district || '',
    region: plan.region || '',
    createdAt: typeof plan.createdAt === 'string' ? new Date(plan.createdAt).getTime() : (plan.createdAt || Date.now()),
    updatedAt: Date.now(),
    planData: serializedPlanData
  };
}

export function restoreNestedArrays(docData: any): any {
  if (!docData) return docData;
  
  let restoredPlan = docData;
  if (typeof docData.planData === 'string') {
    try {
      restoredPlan = JSON.parse(docData.planData);
    } catch (e) {
      console.error("Failed to parse planData from Firestore", e);
    }
  }
  
  const normalizedPlan = {
    pillars: [],
    bearings: [],
    distances: [],
    landmarks: [],
    buildings: [],
    roads: [],
    roadNetwork: [],
    overlays: [],
    ...restoredPlan
  };

  if (normalizedPlan.osmDataSerialized) {
    try {
      normalizedPlan.osmData = JSON.parse(normalizedPlan.osmDataSerialized);
    } catch (e) {
      console.error("Failed to parse osmDataSerialized", e);
    }
  }

  return normalizedPlan;
}
