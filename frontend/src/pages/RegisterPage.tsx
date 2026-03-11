import { FC } from "react";

import { SignupForm } from "../components/signup-form";

interface RegisterPageProps {
  className?: string;
}

const RegisterPage: FC<RegisterPageProps> = ({ className = "" }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm className={className} />
      </div>
    </div>
  );
};

export default RegisterPage;
