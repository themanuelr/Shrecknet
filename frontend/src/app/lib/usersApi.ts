import { API_URL } from "./config";


export async function getUserCount(): Promise<number> {
  const res = await fetch(`${API_URL}/users/users`);
  if (!res.ok) throw new Error("Could not fetch user list");
  const users = await res.json();
  return users.length;
}

export async function registerUser({ nickname, email, password, role, image_url }: unknown) {
  const res = await fetch(`${API_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, email, password, role, image_url }),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

  export async function loginUser({ email, password }: unknown) {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  }


// GET all users (requires token)
export async function getUsers(token: string) {
  const res = await fetch(`${API_URL}/users/users/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not fetch users");
  return await res.json();
}

// UPDATE user
export async function updateUser(userId: number, data: unknown, token: string) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();    

  return await res.json();
}

// DELETE user
export async function deleteUser(userId: number, token: string) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}


export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}