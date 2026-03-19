import { useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FileText, PanelsTopLeft, Settings, UploadCloud } from "lucide-react";
import { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { CheckHistoryContext } from "../App";
import { documentsApi } from "../api/client";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import type { ValidationReport } from "../types";

interface UploadPageProps {
  className?: string;
}

interface Profile {
  id: string;
  name: string;
  university: string;
  description?: string;
  is_system?: boolean;
}

interface HistoryItem {
  fileName: string;
  timestamp: number;
  totalIssues: number;
  score: number;
  reportData: ValidationReport;
  profileId: string;
}

interface CheckHistoryContextType {
  addToHistory: (item: HistoryItem) => void;
}

type ProfilesRouteMode = "manage" | "edit" | "import-export";

const UploadPage: FC<UploadPageProps> = ({ className = "" }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addToHistory } = useContext(CheckHistoryContext) as CheckHistoryContextType;
  const isDark = theme.palette.mode === "dark";

  const toastStyle = useMemo(
    () => ({
      background: isDark ? "#121214" : "#ffffff",
      color: isDark ? "#ffffff" : "#111111",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(17,17,17,0.08)",
      borderRadius: "16px",
      boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.35)" : "0 18px 40px rgba(17,17,17,0.08)",
    }),
    [isDark],
  );

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("default_gost");

  const selectedProfileData = useMemo(() => {
    return profiles.find((profile) => profile.id === selectedProfile) ?? null;
  }, [profiles, selectedProfile]);

  const profileKindLabel = useMemo(() => {
    if (!selectedProfileData) {
      return "Базовый";
    }

    if (selectedProfileData.is_system || selectedProfileData.id.startsWith("default")) {
      return "Системный";
    }

    return "Пользовательский";
  }, [selectedProfileData]);

  useEffect((): void => {
    const loadProfiles = async (): Promise<void> => {
      try {
        const accessToken = localStorage.getItem("access_token") || undefined;
        const loadedProfiles = await documentsApi.getProfiles(accessToken);

        if (Array.isArray(loadedProfiles) && loadedProfiles.length > 0) {
          setProfiles(loadedProfiles as Profile[]);
          const savedProfile = localStorage.getItem("cursa_profile");
          if (
            savedProfile &&
            loadedProfiles.find((profile) => (profile as Profile).id === savedProfile)
          ) {
            setSelectedProfile(savedProfile);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось загрузить профили";
        console.error("Failed to load profiles:", message);
      }
    };

    loadProfiles();
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]): void => {
      if (!acceptedFiles.length) return;

      const selectedFile = acceptedFiles[0];
      if (!selectedFile.name.toLowerCase().endsWith(".docx")) {
        toast.error("Поддерживается только формат .docx", { style: toastStyle });
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("Файл слишком велик (макс 20 МБ)", { style: toastStyle });
        return;
      }

      setFile(selectedFile);
      toast.success("Файл готов к обработке", { style: toastStyle });
    },
    [toastStyle],
  );

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleProfileChange = useCallback((profileId: string): void => {
    setSelectedProfile(profileId);
    localStorage.setItem("cursa_profile", profileId);
  }, []);

  const handleProfilesNavigation = useCallback(
    (mode: ProfilesRouteMode): void => {
      navigate("/profiles", {
        state: {
          mode,
          profileId: selectedProfile || "default_gost",
          source: "upload",
        },
      });
    },
    [navigate, selectedProfile],
  );

  const handleProcess = async (): Promise<void> => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(12);

    try {
      localStorage.setItem("cursa_profile", selectedProfile || "default_gost");
      setUploadProgress(34);

      const reportData = await documentsApi.validate(
        file,
        selectedProfile || "default_gost",
        localStorage.getItem("access_token") || undefined,
      );

      setUploadProgress(100);

      const totalIssues = Array.isArray((reportData as { issues?: unknown[] })?.issues)
        ? ((reportData as { issues?: unknown[] }).issues?.length ?? 0)
        : ((reportData as { check_results?: { total_issues_count?: number } })?.check_results
            ?.total_issues_count ?? 0);

      addToHistory({
        fileName: file.name,
        timestamp: Date.now(),
        totalIssues,
        score: (reportData?.score as number) ?? 0,
        reportData: reportData as unknown as ValidationReport,
        profileId: selectedProfile || "default_gost",
      });

      navigate("/report", {
        state: {
          reportData,
          fileName: file.name,
          profileId: selectedProfile || "default_gost",
          profileName: selectedProfileData?.university || selectedProfileData?.name || "ГОСТ",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось обработать документ";
      toast.error(message, { style: toastStyle });
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleClearFile = (): void => {
    if (!isProcessing) {
      setFile(null);
      setUploadProgress(0);
    }
  };

  return (
    <AppPageLayout title="Главная" className={className}>
      <Toaster position="bottom-center" />

      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-3xl items-center justify-center">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className="w-full"
            >
              <div className="space-y-4">
                <Card className="overflow-hidden rounded-[28px] border-border bg-card/90 shadow-surface">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                      <div className="space-y-2">
                        <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-background/80 text-muted-foreground">
                          <PanelsTopLeft className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Профиль проверки
                          </p>
                          <h2 className="mt-1 font-sans text-xl font-semibold tracking-[-0.04em] text-foreground md:text-2xl">
                            {selectedProfileData?.name || "Базовый ГОСТ"}
                          </h2>
                          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                            Выберите требования перед загрузкой документа. Это влияет на правила
                            анализа и автокоррекции.
                          </p>
                        </div>
                      </div>

                      <div className="w-full md:max-w-[320px]">
                        <label
                          htmlFor="upload-profile-select"
                          className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                        >
                          Активный профиль
                        </label>
                        <select
                          id="upload-profile-select"
                          value={selectedProfile}
                          onChange={(event) => handleProfileChange(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/30"
                        >
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                              {profile.university ? ` · ${profile.university}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs"
                        data-testid="selected-profile-summary"
                      >
                        {profileKindLabel}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {selectedProfileData?.university || "ГОСТ"}
                      </Badge>
                      {selectedProfileData?.description ? (
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          {selectedProfileData.description}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 justify-start rounded-2xl"
                        onClick={() => handleProfilesNavigation("manage")}
                        data-testid="manage-profiles-button"
                      >
                        <PanelsTopLeft className="size-4" />
                        Профили
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 justify-start rounded-2xl"
                        onClick={() => handleProfilesNavigation("edit")}
                        data-testid="quick-edit-profile-button"
                      >
                        <Settings className="size-4" />
                        Изменить профиль
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 justify-start rounded-2xl"
                        onClick={() => handleProfilesNavigation("import-export")}
                        data-testid="quick-import-export-button"
                      >
                        <ArrowUpRight className="size-4" />
                        Импорт и экспорт
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-[32px] border-border bg-card/90 shadow-surface">
                  <CardContent className="p-5 md:p-8">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "cursor-pointer rounded-[28px] border-2 border-dashed p-6 text-center transition-all duration-200 md:p-10",
                        isDragActive
                          ? "border-foreground/30 bg-accent"
                          : "border-border bg-background/60 hover:border-foreground/20 hover:bg-accent/60",
                      )}
                    >
                      <input {...getInputProps()} />

                      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm md:size-20">
                        <UploadCloud className="size-7 text-muted-foreground md:size-8" />
                      </div>

                      <div className="mb-4 space-y-2">
                        <h1 className="font-sans text-2xl font-semibold tracking-[-0.04em] text-foreground md:text-3xl">
                          {isDragActive ? "Отпустите документ" : "Перетащите .docx сюда"}
                        </h1>
                        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                          Или нажмите на карточку, чтобы выбрать файл. Интерфейс теперь работает
                          через новый shadcn-shell и оставляет только главное действие.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          Только DOCX
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          До 20 МБ
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          Профиль: {selectedProfileData?.name || "Базовый ГОСТ"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-ready"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              className="w-full"
            >
              <Card className="overflow-hidden rounded-[32px] border-border bg-card/90 shadow-surface">
                <CardContent className="p-5 md:p-8">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Документ
                      </p>
                      <h2 className="font-sans text-2xl font-semibold tracking-[-0.04em] text-foreground md:text-3xl">
                        Файл готов к проверке
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      disabled={isProcessing}
                      aria-label="Очистить выбранный файл"
                      title="Очистить выбранный файл"
                      className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      <ArrowUpRight className="size-4 rotate-45" />
                    </button>
                  </div>

                  <div className="mb-5 rounded-3xl border border-border bg-background/70 p-4 md:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card">
                        <FileText className="size-5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground md:text-base">
                          {file.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} МБ · DOCX
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      Готов к анализу
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      Профиль:{" "}
                      {profiles.find((profile) => profile.id === selectedProfile)?.name || "ГОСТ"}
                    </Badge>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Файл выбран и подготовлен к быстрой проверке. Следующим шагом система построит
                    отчёт и сохранит его в историю.
                  </p>

                  {isProcessing ? (
                    <div className="mb-5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="h-2 rounded-full bg-primary"
                      />
                    </div>
                  ) : null}

                  <Button
                    className="h-12 w-full rounded-2xl text-sm font-semibold md:text-base"
                    onClick={handleProcess}
                    disabled={isProcessing}
                  >
                    {isProcessing ? `Анализируем файл... ${uploadProgress}%` : "Начать проверку"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppPageLayout>
  );
};

export default UploadPage;
