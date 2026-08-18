import { SignUp } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

export default function SignUpPage() {
  return (
    <div className="flex w-full items-center justify-center">
      <SignUp appearance={clerkTheme} />
    </div>
  );
}
