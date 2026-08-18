import { SignIn } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

export default function SignInPage() {
  return (
    <div className="flex w-full items-center justify-center">
      <SignIn appearance={clerkTheme} />
    </div>
  );
}
