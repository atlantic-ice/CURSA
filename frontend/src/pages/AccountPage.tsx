import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  MailWarning,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { FC, useContext, useMemo, useState } from "react";

import { AuthContext, CheckHistoryContext } from "../App";
import { accountApi, getApiErrorMessage } from "../api/client";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import usePageStyles from "../hooks/usePageStyles";
import { cn } from "../lib/utils";
import type { HistoryItem } from "../types";

const ROLE_LABELS: Record<string, string> = {
  user: "Пользователь",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
  admin: "Администратор",
  guest: "Гость",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  user: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pro: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  team: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  enterprise: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  admin: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  guest: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

const OAUTH_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  yandex: "Яндекс",
  telegram: "Telegram",
};

interface SnackbarState {
  open: boolean;
  message: string;
  error: boolean;
}

interface UserProfile {
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  role?: string;
  is_email_verified?: boolean;
  is_2fa_enabled?: boolean;
  has_password?: boolean;
  oauth_provider?: string;
  created_at?: string;
}

interface AccountAuthContextType {
  user: UserProfile | null;
  updateUser: (userData: UserProfile) => void;
}

interface AccountHistoryContextType {
  history: HistoryItem[];
}

interface ProfileFieldConfig {
  key: "firstName" | "lastName" | "organization";
  label: string;
  placeholder: string;
  icon: typeof UserRound;
}

interface AccountPageProps {}

const profileFields: ProfileFieldConfig[] = [
  {
    key: "firstName",
    label: "Имя",
    placeholder: "Введите имя",
    icon: UserRound,
  },
  {
    key: "lastName",
    label: "Фамилия",
    placeholder: "Введите фамилию",
    icon: BadgeCheck,
  },
  {
    key: "organization",
    label: "Организация",
    placeholder: "Введите организацию",
    icon: Building2,
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const AccountPage: FC<AccountPageProps> = () => {
  const { pageBackground } = usePageStyles();
  const { user, updateUser } = useContext(AuthContext) as unknown as AccountAuthContextType;
  const { history } = useContext(CheckHistoryContext) as unknown as AccountHistoryContextType;

  const [profileEditing, setProfileEditing] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>(user?.first_name || "");
  const [lastName, setLastName] = useState<string>(user?.last_name || "");
  const [organization, setOrganization] = useState<string>(user?.organization || "");
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  const [passwordOpen, setPasswordOpen] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [twoFaOpen, setTwoFaOpen] = useState<boolean>(false);
  const [twoFaLoading, setTwoFaLoading] = useState<boolean>(false);
  const [twoFaQrCode, setTwoFaQrCode] = useState<string>("");
  const [twoFaSecret, setTwoFaSecret] = useState<string>("");
  const [twoFaToken, setTwoFaToken] = useState<string>("");
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);

  const [verificationSending, setVerificationSending] = useState<boolean>(false);
  const [snack, setSnack] = useState<SnackbarState>({ open: false, message: "", error: false });

  const showSnack = (message: string, error = false): void => {
    setSnack({ open: true, message, error });
  };

  const getAccessToken = (): string | null => localStorage.getItem("access_token");

  const resetPasswordForm = (): void => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const resetTwoFaSetup = (): void => {
    setTwoFaOpen(false);
    setTwoFaQrCode("");
    setTwoFaSecret("");
    setTwoFaToken("");
    setTwoFaBackupCodes([]);
  };

  const cancelProfileEdit = (): void => {
    setProfileEditing(false);
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setOrganization(user?.organization || "");
  };

  const saveProfile = async (): Promise<void> => {
    setProfileSaving(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      const data = await accountApi.updateMe<UserProfile>(
        { first_name: firstName, last_name: lastName, organization },
        accessToken,
      );
      if (data?.user) {
        updateUser(data.user);
      }
      showSnack("Профиль обновлён");
      setProfileEditing(false);
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (newPassword !== confirmPassword) {
      showSnack("Пароли не совпадают", true);
      return;
    }
    if (newPassword.length < 8) {
      showSnack("Минимум 8 символов", true);
      return;
    }

    setPasswordSaving(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      await accountApi.changePassword(
        { old_password: oldPassword, new_password: newPassword },
        accessToken,
      );
      showSnack("Пароль успешно изменён");
      setPasswordOpen(false);
      resetPasswordForm();
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setPasswordSaving(false);
    }
  };

  const startTwoFaSetup = async (): Promise<void> => {
    setTwoFaLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      const data = await accountApi.setup2fa(accessToken);
      setTwoFaQrCode(data.qr_code);
      setTwoFaSecret(data.secret);
      setTwoFaToken("");
      setTwoFaBackupCodes([]);
      setTwoFaOpen(true);
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const confirmTwoFa = async (): Promise<void> => {
    if (twoFaToken.length !== 6) {
      showSnack("Введите 6-значный код", true);
      return;
    }

    setTwoFaLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      const data = await accountApi.enable2fa(
        { secret: twoFaSecret, token: twoFaToken },
        accessToken,
      );
      setTwoFaBackupCodes(data.backup_codes || []);
      if (user) {
        updateUser({ ...user, is_2fa_enabled: true });
      }
      showSnack("2FA успешно включена");
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const disableTwoFa = async (): Promise<void> => {
    setTwoFaLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      await accountApi.disable2fa(accessToken);
      if (user) {
        updateUser({ ...user, is_2fa_enabled: false });
      }
      resetTwoFaSetup();
      showSnack("2FA отключена");
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const resendEmailVerification = async (): Promise<void> => {
    setVerificationSending(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("Требуется повторная авторизация");
      }
      await accountApi.resendVerification(accessToken);
      showSnack("Письмо отправлено");
    } catch (error) {
      showSnack(getApiErrorMessage(error), true);
    } finally {
      setVerificationSending(false);
    }
  };

  const metrics = useMemo(() => {
    const totalChecks = history.length;
    const avgScore =
      totalChecks > 0
        ? Math.round(history.reduce((sum, item) => sum + (item.score || 0), 0) / totalChecks)
        : 0;
    const withFixes = history.filter(
      (item) => item.correctedFilePath || item.reportData?.corrected_file_path,
    ).length;

    return [
      { label: "Проверок", value: totalChecks },
      { label: "Средний балл", value: avgScore },
      { label: "С исправлениями", value: withFixes },
    ];
  }, [history]);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.email?.split("@")[0] || "Аккаунт";
  const initials = (user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const role = user?.role || "user";

  if (!user) {
    return null;
  }

  return (
    <AppPageLayout
      title="Аккаунт"
      maxWidth="narrow"
      style={{ background: pageBackground }}
      contentClassName="gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.35 }}
      >
        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-surface">
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Профиль
                </div>
                <CardTitle className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Личный кабинет
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Управляйте профилем, безопасностью входа и связанными сервисами из одной панели.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                    ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.user,
                  )}
                >
                  {ROLE_LABELS[role] || role}
                </Badge>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl border border-border/70 bg-background/70 px-4 py-3">
              <Avatar className="size-14 border border-border/70 bg-background/90">
                <AvatarFallback className="bg-transparent text-lg font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold text-foreground">{displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {user.organization || "Организация не указана"}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.section>

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/70 bg-card/95 shadow-surface">
            <CardHeader className="pb-3">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-4xl font-semibold">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </motion.section>

      {!user.is_email_verified ? (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <Card className="border-amber-500/20 bg-amber-500/8 shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                  <MailWarning className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-amber-200">Email не подтверждён</div>
                  <div className="mt-1 text-sm leading-6 text-amber-100/70">
                    Проверьте почту или отправьте письмо повторно, чтобы завершить активацию
                    аккаунта.
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-amber-300/25 bg-transparent text-amber-200 hover:bg-amber-300/10 hover:text-amber-100"
                disabled={verificationSending}
                onClick={resendEmailVerification}
              >
                {verificationSending ? <Loader2 className="size-4 animate-spin" /> : null}
                {verificationSending ? "Отправка..." : "Отправить письмо"}
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-background/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>
                  Базовые данные используются в истории, отчётах и персонализации.
                </CardDescription>
              </div>
              {profileEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={cancelProfileEdit}>
                    Отмена
                  </Button>
                  <Button onClick={saveProfile} disabled={profileSaving}>
                    {profileSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {profileSaving ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setProfileEditing(true)}>
                  Редактировать
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profileFields.map((field) => {
                const Icon = field.icon;
                const value =
                  field.key === "firstName"
                    ? firstName
                    : field.key === "lastName"
                      ? lastName
                      : organization;
                const setter =
                  field.key === "firstName"
                    ? setFirstName
                    : field.key === "lastName"
                      ? setLastName
                      : setOrganization;

                return (
                  <div
                    key={field.key}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Icon className="size-3.5" />
                      {field.label}
                    </div>
                    {profileEditing ? (
                      <Input
                        value={value}
                        onChange={(event) => setter(event.target.value)}
                        placeholder={field.placeholder}
                        aria-label={field.label}
                        className="border-white/10 bg-background/70"
                      />
                    ) : (
                      <div className="text-sm text-foreground">{value || "—"}</div>
                    )}
                  </div>
                );
              })}

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Link2 className="size-3.5" />
                  Email
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-foreground">{user.email || "—"}</div>
                  {user.is_email_verified ? (
                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="mr-1 size-3.5" />
                      Подтверждён
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.12 }}
          className="space-y-6"
        >
          <Card className="border-white/10 bg-background/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Пароль</CardTitle>
              </div>
              <CardDescription>
                {user.has_password
                  ? "Обновите текущий пароль для усиления безопасности."
                  : "Установите пароль, чтобы использовать вход не только через OAuth."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordOpen ? (
                <>
                  {user.has_password ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="old-password">
                        Текущий пароль
                      </label>
                      <Input
                        id="old-password"
                        type={showPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        placeholder="Введите текущий пароль"
                        className="border-white/10 bg-background/70"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                      Новый пароль
                    </label>
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Минимум 8 символов"
                      className="border-white/10 bg-background/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="confirm-password"
                    >
                      Подтверждение
                    </label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Повторите пароль"
                      className="border-white/10 bg-background/70"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {showPassword ? "Скрыть пароль" : "Показать пароль"}
                    </button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPasswordOpen(false);
                          resetPasswordForm();
                        }}
                      >
                        Отмена
                      </Button>
                      <Button onClick={handleChangePassword} disabled={passwordSaving}>
                        {passwordSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                        {passwordSaving ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setPasswordOpen(true)}
                  className="w-full justify-center"
                >
                  {user.has_password ? "Изменить пароль" : "Установить пароль"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-background/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Двухфакторная защита</CardTitle>
              </div>
              <CardDescription>
                {user.is_2fa_enabled
                  ? "Дополнительная защита входа активна."
                  : "Подключите приложение-аутентификатор и добавьте второй фактор."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Статус 2FA</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {user.is_2fa_enabled ? "Включена и защищает вход" : "Пока отключена"}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    user.is_2fa_enabled
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
                  )}
                >
                  {user.is_2fa_enabled ? "Включена" : "Отключена"}
                </Badge>
              </div>
              <Button
                variant={user.is_2fa_enabled ? "destructive" : "outline"}
                disabled={twoFaLoading}
                onClick={user.is_2fa_enabled ? disableTwoFa : startTwoFaSetup}
                className="w-full justify-center"
              >
                {twoFaLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                {user.is_2fa_enabled ? "Отключить 2FA" : "Настроить 2FA"}
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.35, delay: 0.14 }}
        className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        <Card className="border-white/10 bg-background/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader>
            <CardTitle>Связанные сервисы</CardTitle>
            <CardDescription>
              Сведения об авторизации и подключённых внешних провайдерах.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Link2 className="size-3.5" />
                OAuth
              </div>
              {user.oauth_provider ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {OAUTH_LABELS[user.oauth_provider] || user.oauth_provider}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Подключено к аккаунту</div>
                  </div>
                  <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    Активно
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Внешний провайдер не подключён.</div>
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <BadgeCheck className="size-3.5" />
                Email
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-foreground">{user.email}</div>
                <Badge
                  variant="outline"
                  className={cn(
                    user.is_email_verified
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300",
                  )}
                >
                  {user.is_email_verified ? "Подтверждён" : "Ожидает подтверждения"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-background/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader>
            <CardTitle>Сводка аккаунта</CardTitle>
            <CardDescription>
              Роль, дата регистрации и текущий статус доступа к возможностям платформы.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Роль
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {ROLE_LABELS[role] || role}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  В CURSA с
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                      })
                    : "Дата недоступна"}
                </div>
              </div>
            </div>
            <Separator />
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm font-medium text-foreground">Безопасность</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Пароль: {user.has_password ? "установлен" : "не настроен"}</li>
                <li>2FA: {user.is_2fa_enabled ? "включена" : "выключена"}</li>
                <li>Email: {user.is_email_verified ? "подтверждён" : "не подтверждён"}</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="text-sm text-muted-foreground">
              Эти данные влияют на доступ к защищённым действиям и уведомлениям.
            </div>
          </CardFooter>
        </Card>
      </motion.section>

      <Dialog open={twoFaOpen} onOpenChange={(open) => !open && !twoFaLoading && resetTwoFaSetup()}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#090b10] text-white">
          <DialogHeader>
            <DialogTitle>Настройка двухфакторной аутентификации</DialogTitle>
            <DialogDescription className="text-white/60">
              Подключите приложение-аутентификатор, подтвердите код и сохраните резервные коды.
            </DialogDescription>
          </DialogHeader>

          {twoFaBackupCodes.length === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[148px_minmax(0,1fr)]">
                <div className="flex h-[148px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-3">
                  {twoFaQrCode ? (
                    <img
                      src={twoFaQrCode}
                      alt="QR код"
                      className="h-full w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="text-sm text-white/40">Загрузка QR...</div>
                  )}
                </div>
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <div className="text-sm font-medium text-white">Как подключить</div>
                    <div className="mt-1 text-sm leading-6 text-white/60">
                      Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или
                      аналогичном приложении.
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                      Код для ручного ввода
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm tracking-[0.22em] text-white/88">
                      {twoFaSecret || "—"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="two-fa-token">
                  Код из приложения
                </label>
                <Input
                  id="two-fa-token"
                  value={twoFaToken}
                  onChange={(event) =>
                    setTwoFaToken(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  inputMode="numeric"
                  className="border-white/10 bg-white/[0.04] text-lg tracking-[0.35em] text-white placeholder:text-white/25"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={resetTwoFaSetup} disabled={twoFaLoading}>
                  Отмена
                </Button>
                <Button onClick={confirmTwoFa} disabled={twoFaLoading || twoFaToken.length !== 6}>
                  {twoFaLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Подтвердить
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-semibold">2FA успешно включена</span>
                </div>
                <div className="mt-2 text-sm leading-6 text-emerald-100/75">
                  Сохраните резервные коды. Они пригодятся, если вы потеряете доступ к приложению
                  аутентификатора.
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {twoFaBackupCodes.map((code) => (
                  <div
                    key={code}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm tracking-[0.18em] text-white/90"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={resetTwoFaSetup}>Готово</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {snack.open ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur",
              snack.error
                ? "border-rose-500/25 bg-rose-500/12 text-rose-200"
                : "border-emerald-500/25 bg-emerald-500/12 text-emerald-100",
            )}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div>{snack.message}</div>
              <button
                type="button"
                onClick={() => setSnack((current) => ({ ...current, open: false }))}
                className="text-current/70 transition-opacity hover:opacity-100"
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageLayout>
  );
};

export default AccountPage;
