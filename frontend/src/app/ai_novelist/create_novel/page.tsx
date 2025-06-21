"use client";
export const dynamic = "force-dynamic";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useAuth } from "../../components/auth/AuthProvider";
import { hasRole } from "../../lib/roles";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CreateNovelPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");

  if (!hasRole(user?.role, "writer")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full flex items-center justify-center text-indigo-900 px-2 sm:px-6 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">AI Novelist - Coming Soon</h1>
            {agentId && (
              <p className="text-lg text-indigo-700">Selected novelist ID: {agentId}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function CreateNovelPage() {
  return (
    <Suspense>
      <CreateNovelPageContent />
    </Suspense>
  );
}
