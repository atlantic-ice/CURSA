import { FC } from "react";

import { LoginForm } from "../components/login-form";

interface LoginPageProps {
  className?: string;
}

const LoginPage: FC<LoginPageProps> = ({ className = "" }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm className={className} />
      </div>
    </div>
  );
};

export default LoginPage;
