"use client";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { hasRole } from "../lib/roles";
import { useAuth } from "../components/auth/AuthProvider";
import UserGrid from "../components/user_management/User_Grid";
import UserModal from "../components/user_management/User_Modal";
import { useUsers } from "../lib/useUsers";
import { useState } from "react";

export default function UserManagementPage() {
  const { user } = useAuth();
  const { users, isLoading, error, mutate } = useUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [success, setSuccess] = useState(""); 

  if (!hasRole(user?.role, "player")) {
    return (
      <DashboardLayout>
        <div className="p-10 text-2xl text-red-600 font-bold">Not authorized</div>
      </DashboardLayout>
    );
  }
  

  return (
    <AuthGuard>      
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 px-2 sm:px-6 py-8">
          <div className="mx-auto max-w-5xl w-full">
            <div className="flex items-center justify-between mb-7">
              <h1
                className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary)] tracking-tight"
                style={{ marginBottom: 0 }}
              >
                Elders and Sages
              </h1>
                Come back another time, we are still learning :)
            </div>

            </div>
           
        </div>
      </DashboardLayout>      
    </AuthGuard>
  );
}
