import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-8">
        <div>
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--foreground)]">
            Welcome to Conversa
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Audio-first meeting intelligence platform
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
