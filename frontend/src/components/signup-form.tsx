import { GalleryVerticalEnd } from "lucide-react";
import { ComponentProps, FormEvent, useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../App";
import { authApi } from "../api/client";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "./ui/field";
import { Input } from "./ui/input";

interface SignupFormProps extends ComponentProps<"div"> {}

interface SignupCompletionData {
  firstName: string;
  lastName: string;
  organization: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
}

const initialCompletionData: SignupCompletionData = {
  firstName: "",
  lastName: "",
  organization: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm({ className, ...props }: SignupFormProps) {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) as AuthContextType;

  const [email, setEmail] = useState("");
  const [completionData, setCompletionData] = useState<SignupCompletionData>(initialCompletionData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmitCompletion = useMemo(
    () =>
      completionData.firstName.trim().length > 0 &&
      completionData.password.length >= 8 &&
      completionData.password === completionData.confirmPassword,
    [completionData],
  );

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setError("");
    setDialogOpen(true);
  };

  const handleCompletionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmitCompletion) {
      setError("Заполните обязательные поля и проверьте пароль.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.register({
        email,
        password: completionData.password,
        first_name: completionData.firstName,
        last_name: completionData.lastName,
        organization: completionData.organization,
      });
      await login(email, completionData.password);
      navigate("/dashboard");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : "Не удалось завершить регистрацию.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionChange = (field: keyof SignupCompletionData, value: string) => {
    setCompletionData((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <form onSubmit={handleEmailSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <Link to="/register" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">Cursa</span>
              </Link>
              <h1 className="text-xl font-bold">Добро пожаловать в Cursa</h1>
              <FieldDescription>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <Button type="submit">Создать аккаунт</Button>
            </Field>
            <FieldSeparator>Или</FieldSeparator>
            <Field className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Войти через Apple
              </Button>
              <Button variant="outline" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Войти через Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <FieldDescription className="px-6 text-center">
          Нажимая «Продолжить», вы принимаете <a href="/terms">условия сервиса</a> и{" "}
          <a href="/privacy-policy">политику конфиденциальности</a>.
        </FieldDescription>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершите создание аккаунта</DialogTitle>
            <DialogDescription>
              Заполните оставшиеся поля, чтобы создать аккаунт Cursa для {email || "вашего email"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompletionSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first-name">Имя</FieldLabel>
                <Input
                  id="first-name"
                  value={completionData.firstName}
                  onChange={(event) => handleCompletionChange("firstName", event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="last-name">Фамилия</FieldLabel>
                <Input
                  id="last-name"
                  value={completionData.lastName}
                  onChange={(event) => handleCompletionChange("lastName", event.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="organization">Организация</FieldLabel>
              <Input
                id="organization"
                value={completionData.organization}
                onChange={(event) => handleCompletionChange("organization", event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={completionData.password}
                  onChange={(event) => handleCompletionChange("password", event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Подтвердите пароль</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  value={completionData.confirmPassword}
                  onChange={(event) =>
                    handleCompletionChange("confirmPassword", event.target.value)
                  }
                  required
                />
              </Field>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Создаём..." : "Завершить регистрацию"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
