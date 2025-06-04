"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getUserCount, loginUser, registerUser } from "../../lib/usersApi";

// Material 3 Floating Label Field
function M3TextField({
  label="",
  name="",
  type = "text",
  value="",
  onChange= () => {} ,
  autoComplete="",
  required = false,
}) {
  return (
    <div className="relative my-1 w-full">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="peer w-full px-4 pt-6 pb-2 text-[var(--foreground)] bg-transparent border-2 border-[var(--primary)] rounded-xl outline-none focus:border-[var(--accent)] transition-colors placeholder-transparent"
        placeholder=" "
      />
      <label
        htmlFor={name}
        className="absolute left-3 top-1.5 text-sm text-[var(--primary)] font-medium
          transition-all duration-200 pointer-events-none
          peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-[var(--accent)]
          peer-focus:top-1.5 peer-focus:left-3 peer-focus:text-sm peer-focus:text-[var(--primary)]"
      >
        {label}
      </label>
    </div>
  );
}

enum FormMode {
  LOGIN,
  REGISTER,
  FIRST_USER,
}

export default function AuthCard() {
  const [formMode, setFormMode] = useState<FormMode>(FormMode.LOGIN);
  const [usersExist, setUsersExist] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setToken, setRedirectAfterLogin, getRedirectAfterLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    getUserCount()
      .then((count) => {
        setUsersExist(count > 0);
        setFormMode(count > 0 ? FormMode.LOGIN : FormMode.FIRST_USER);
      })
      .catch(() => setUsersExist(true));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (formMode === FormMode.LOGIN) {
        const { access_token } = await loginUser({ email: form.email, password: form.password });
        setToken(access_token);
        const redirectTo = getRedirectAfterLogin() || "/worlds";
        setRedirectAfterLogin(null);
        router.replace(redirectTo);
      } else {
        const role = formMode === FormMode.FIRST_USER ? "system admin" : "player";
        await registerUser({
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          role,
          image_url: "/images/default/avatars/logo.png",
        });
        const { access_token } = await loginUser({ email: form.email, password: form.password });
        setToken(access_token);
        setRedirectAfterLogin(null);
        router.replace("/worlds");
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const errObj = err as Record<string, unknown>;
        setError(
          (typeof errObj.detail === "string" && errObj.detail) ||
          (typeof errObj.message === "string" && errObj.message) ||
          "Unknown error!" + err
        );
      } else {
        setError("Unknown error!");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setFormMode((m) =>
      m === FormMode.LOGIN ? FormMode.REGISTER : FormMode.LOGIN
    );
    setError(null);
    setForm({ email: "", password: "", nickname: "" });
  };

  if (usersExist === null)
    return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="auth-card bg-[var(--card-bg)]  rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-[400px] w-full border border-[var(--accent)]/40 animate-fadeIn transition-all duration-200 backdrop-blur-[6px]">
      <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] pointer-events-none" />
      <div className="absolute inset-0 rounded-[2.5rem] bg-white/5 pointer-events-none" />
      <h3 className="font-semibold text-xl mb-6 text-[var(--primary)] text-left">
        {formMode === FormMode.LOGIN
          ? "Sign in to your adventure"
          : formMode === FormMode.REGISTER
          ? "Create your account"
          : "Welcome, World Builder!"}
      </h3>

      {formMode === FormMode.FIRST_USER && (
        <div className="font-sans text-base text-[var(--accent)] mb-6 text-left">
          No users found. <br />
          <span className="font-semibold text-yellow-400">
            Set up the first account as System Admin!
          </span>
        </div>
      )}
      {error && (
        <div className="w-full mb-4 py-2 px-4 bg-red-600/90 rounded-lg text-white text-center text-sm">
          {error}
        </div>
      )}

      <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
        {(formMode === FormMode.REGISTER || formMode === FormMode.FIRST_USER) && (
          <M3TextField
            label="Nickname"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            autoComplete="nickname"
            required
          />
        )}
        <M3TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        <M3TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete={
            formMode === FormMode.LOGIN ? "current-password" : "new-password"
          }
          required
        />
        <button
          className="relative w-full py-3 min-h-[48px] mt-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-lg shadow-md hover:bg-[var(--accent)] hover:text-[var(--background)] transition-all uppercase tracking-wide overflow-hidden ripple"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : formMode === FormMode.LOGIN
            ? "Sign In"
            : "Create Account"}
        </button>
      </form>
      <div className="flex justify-between w-full text-xs mt-4">
        {formMode === FormMode.LOGIN && (
          <button
            className="text-[var(--accent)] hover:underline"
            type="button"
            onClick={switchMode}
          >
            Create account
          </button>
        )}
        {(formMode === FormMode.REGISTER || formMode === FormMode.FIRST_USER) &&
          usersExist && (
            <button
              className="text-[var(--accent)] hover:underline"
              type="button"
              onClick={switchMode}
            >
              Login as existing user
            </button>
          )}
      </div>
    </div>
    
  );
}
