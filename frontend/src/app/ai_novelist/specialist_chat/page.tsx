"use client";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useSearchParams } from "next/navigation";

export default function SpecialistChatPage() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full flex items-center justify-center text-indigo-900 px-2 sm:px-6 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">AI Specialist Chat - Coming Soon</h1>
            {agentId && (
              <p className="text-lg text-indigo-700">Selected specialist ID: {agentId}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
