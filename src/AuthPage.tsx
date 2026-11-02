
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import {
  loginRequest,
  registerRequest,
  type User,
} from "./api";
import "./AuthPage.css";

type AuthPageProps = {
  onAuthenticated: (user: User) => Promise<void>;
};

function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const user =
        mode === "register"
          ? await registerRequest({ name, email, password })
          : await loginRequest({ email, password });

      await onAuthenticated(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <a href="#" className="auth-brand">
          <span className="auth-brand-icon">
            <Sparkles size={23} />
          </span>
          devflow<span>.</span>
        </a>

        <div className="auth-visual-content">
          <div className="auth-pill">
            <span />
            A BETTER WAY TO WORK
          </div>

          <h1>
            Make space
            <br />
            for <span>great work.</span>
          </h1>

          <p>
            Organize your projects, bring your team together,
            and turn your ideas into meaningful progress.
          </p>

          <div className="auth-decoration">
            <div className="decoration-card decoration-card-one">
              <span className="decoration-dot green-dot" />
              <div>
                <strong>Design your future</strong>
                <small>One task at a time.</small>
              </div>
              <Sparkles size={20} />
            </div>

            <div className="decoration-card decoration-card-two">
              <span className="decoration-check">✓</span>
              <div>
                <strong>Progress feels good.</strong>
                <small>Keep moving forward.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">
          Made for people who love making things happen.
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-icon">
            <LockKeyhole size={23} />
          </div>

          <span className="auth-eyebrow">
            YOUR WORKSPACE AWAITS
          </span>

          <h2>
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h2>

          <p className="auth-subtitle">
            {mode === "login"
              ? "Enter your details to access your workspace."
              : "Start organizing your work with DevFlow."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>

              <div className="auth-password-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>

          <p className="auth-terms">
            By continuing, you agree to use DevFlow responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
