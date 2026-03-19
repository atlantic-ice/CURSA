import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRightLeft,
  BarChart3,
  BookMarked,
  Copy,
  FileDown,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutList,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  Ruler,
  School,
  ShieldCheck,
  Table2,
  Trash2,
  Type,
} from "lucide-react";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { getApiErrorMessage, profilesApi } from "../api/client";
import ProfileBulkOperations from "../components/ProfileBulkOperations";
import ProfileComparison from "../components/ProfileComparison";
import ProfileEditor from "../components/ProfileEditor";
import ProfileHistory from "../components/ProfileHistory";
import ProfileImportExport from "../components/ProfileImportExport";
import ProfileStatistics from "../components/ProfileStatistics";
import ProfileValidation from "../components/ProfileValidation";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { SearchField } from "../components/ui/search-field";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { cn } from "../lib/utils";

interface FontSettings {
  name: string;
  size: number;
  color: string;
}

interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface HeadingSettings {
  font_size: number;
  alignment: string;
  space_after?: number;
  first_line_indent?: number;
}

interface BibliographySettings {
  style: string;
  font_size?: number;
  sort_order: string;
  min_sources?: number;
  max_age_years?: number;
}

interface ProfileRules {
  font: FontSettings;
  margins: Margins;
  line_spacing: number;
  first_line_indent: number;
  paragraph_alignment: string;
  headings: {
    h1: HeadingSettings;
    h2: HeadingSettings;
  };
  tables: {
    font_size: number;
    line_spacing: number;
  };
  captions: {
    font_size: number;
    separator: string;
    alignment: string;
  };
  lists: {
    font_size: number;
    left_indent: number;
  };
  footnotes: {
    font_size: number;
    line_spacing: number;
  };
  bibliography?: BibliographySettings;
  required_sections: string[];
}

interface Profile {
  id: string;
  name: string;
  description?: string;
  category: "gost" | "university" | "custom";
  university?: string;
  version?: string;
  is_system?: boolean;
}

interface ProfileData extends Profile {
  extends?: string;
  rules: ProfileRules;
}

interface ProfileFormData {
  name: string;
  description?: string;
  category: "gost" | "university" | "custom";
  university?: string;
  version?: string;
  rules?: ProfileRules;
}

interface ProfilesNavigationState {
  mode?: "manage" | "edit" | "import-export" | "compare" | "statistics" | "bulk" | "create";
  profileId?: string;
  source?: string;
}

interface ProfilesEntryContext {
  source?: string;
  message: string;
}

interface ImportResult {
  id: string;
  name: string;
}

interface CategoryCounts {
  all: number;
  gost: number;
  university: number;
  custom: number;
}

interface RuleCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  delay: number;
}

interface RuleItemProps {
  label: string;
  value: string | number;
}

interface ProfilesPageProps {}

const pagePanelClass = "border-[#2e2f2f] bg-[#171717] text-[#fafafa] shadow-sm backdrop-blur-sm";

const getCategoryLabel = (category: Profile["category"]): string => {
  switch (category) {
    case "gost":
      return "ГОСТ";
    case "university":
      return "Университет";
    default:
      return "Пользовательский";
  }
};

const getAlignmentLabel = (value: string): string => {
  switch (value) {
    case "JUSTIFY":
      return "По ширине";
    case "CENTER":
      return "По центру";
    case "LEFT":
      return "По левому краю";
    case "RIGHT":
      return "По правому краю";
    default:
      return value;
  }
};

const getCategoryIcon = (category: Profile["category"], className?: string) => {
  switch (category) {
    case "gost":
      return <ShieldCheck className={className} />;
    case "university":
      return <GraduationCap className={className} />;
    default:
      return <FileText className={className} />;
  }
};

const RuleCard: FC<RuleCardProps> = ({ title, icon, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, delay }}
    className="h-full"
  >
    <Card className={cn(pagePanelClass, "h-full rounded-3xl")}>
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-muted-foreground">
            {icon}
          </div>
          <CardTitle className="text-base font-semibold tracking-[-0.02em]">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-3">{children}</CardContent>
    </Card>
  </motion.div>
);

const RuleItem: FC<RuleItemProps> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

const SummaryCard: FC<{ label: string; value: number; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <Card className={cn(pagePanelClass, "rounded-3xl")}>
    <CardContent className="p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
);

const ProfilesPage: FC<ProfilesPageProps> = () => {
  const location = useLocation();
  const navigationState = (location.state as ProfilesNavigationState | null) ?? null;
  const navigationAppliedRef = useRef<boolean>(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editorSeed, setEditorSeed] = useState<ProfileFormData | null>(null);
  const [pendingNavigationMode, setPendingNavigationMode] =
    useState<ProfilesNavigationState | null>(null);
  const [entryContext, setEntryContext] = useState<ProfilesEntryContext | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryTab, setCategoryTab] = useState<"all" | "gost" | "university">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showImportExport, setShowImportExport] = useState<boolean>(false);
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [showBulkOperations, setShowBulkOperations] = useState<boolean>(false);

  const buildEditableSeed = useCallback((profile: ProfileData): ProfileFormData => {
    return {
      name: profile.is_system ? `${profile.name} (Системный)` : profile.name,
      description: profile.description || "",
      category: profile.is_system ? "custom" : profile.category,
      university: profile.university,
      version: profile.version || "1.0",
      rules: JSON.parse(JSON.stringify(profile.rules)),
    };
  }, []);

  const fetchProfiles = useCallback(async (): Promise<void> => {
    try {
      const data = await profilesApi.list<Profile>();
      setProfiles(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка загрузки профилей. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const fetchProfileDetails = useCallback(async (id: string): Promise<void> => {
    setLoadingDetails(true);
    setError(null);
    try {
      const data = await profilesApi.getById<ProfileData>(id);
      setProfileData(data);
    } catch (err) {
      console.error(err);
      setError("Ошибка загрузки профиля. Проверьте соединение.");
      setProfileData(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId && !isCreating) {
      void fetchProfileDetails(selectedId);
      setIsEditing(false);
    }
  }, [fetchProfileDetails, isCreating, selectedId]);

  const handleCreateStart = useCallback((seedData: ProfileFormData | null = null): void => {
    setIsCreating(true);
    setIsEditing(false);
    setEditorSeed(seedData);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setSelectedId(null);
    setProfileData(null);
  }, []);

  const handleEditStart = useCallback((): void => {
    setIsEditing(true);
    setIsCreating(false);
    setEditorSeed(null);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
  }, []);

  const handleCancel = useCallback((): void => {
    setIsCreating(false);
    setIsEditing(false);
    setEditorSeed(null);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    if (!selectedId && profiles.length > 0) {
      setSelectedId(profiles[0].id);
    }
  }, [profiles, selectedId]);

  const handleShowComparison = useCallback((): void => {
    setShowComparison(true);
    setEditorSeed(null);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  const handleShowImportExport = useCallback((): void => {
    setShowImportExport(true);
    setEditorSeed(null);
    setShowComparison(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  const handleShowStatistics = useCallback((): void => {
    setShowStatistics(true);
    setEditorSeed(null);
    setShowImportExport(false);
    setShowComparison(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  const handleShowBulkOperations = useCallback((): void => {
    setShowBulkOperations(true);
    setEditorSeed(null);
    setShowStatistics(false);
    setShowImportExport(false);
    setShowComparison(false);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  useEffect(() => {
    if (navigationAppliedRef.current || !navigationState || profiles.length === 0) {
      return;
    }

    const requestedProfileId =
      navigationState.profileId &&
      profiles.some((profile) => profile.id === navigationState.profileId)
        ? navigationState.profileId
        : profiles[0]?.id;

    if (requestedProfileId) {
      setSelectedId(requestedProfileId);
    }

    switch (navigationState.mode) {
      case "import-export":
        handleShowImportExport();
        setEntryContext({
          source: navigationState.source,
          message: "Импортируйте шаблон профиля через JSON.",
        });
        navigationAppliedRef.current = true;
        break;
      case "compare":
        handleShowComparison();
        navigationAppliedRef.current = true;
        break;
      case "statistics":
        handleShowStatistics();
        navigationAppliedRef.current = true;
        break;
      case "bulk":
        handleShowBulkOperations();
        navigationAppliedRef.current = true;
        break;
      case "create":
        handleCreateStart();
        setEntryContext({
          source: navigationState.source,
          message: "Создайте новый шаблон профиля, настройте параметры и сохраните.",
        });
        navigationAppliedRef.current = true;
        break;
      case "edit":
        setPendingNavigationMode({ ...navigationState, profileId: requestedProfileId });
        break;
      default:
        if (navigationState.source === "upload") {
          setEntryContext({
            source: navigationState.source,
            message: "Выберите шаблон, настройте параметры и загрузите файл.",
          });
        }
        navigationAppliedRef.current = true;
        break;
    }
  }, [
    handleCreateStart,
    handleShowBulkOperations,
    handleShowComparison,
    handleShowImportExport,
    handleShowStatistics,
    navigationState,
    profiles,
  ]);

  useEffect(() => {
    if (
      !pendingNavigationMode?.profileId ||
      !profileData ||
      profileData.id !== pendingNavigationMode.profileId
    ) {
      return;
    }

    if (pendingNavigationMode.mode === "edit") {
      if (profileData.is_system) {
        handleCreateStart(buildEditableSeed(profileData));
        setEntryContext({
          source: pendingNavigationMode.source,
          message:
            "Системный шаблон защищён, параметры можно изменить только при создании нового профиля.",
        });
      } else {
        handleEditStart();
        setEntryContext({
          source: pendingNavigationMode.source,
          message: "Редактируйте параметры выбранного профиля.",
        });
      }
    }

    navigationAppliedRef.current = true;
    setPendingNavigationMode(null);
  }, [buildEditableSeed, handleCreateStart, handleEditStart, pendingNavigationMode, profileData]);

  const handleImportSuccess = async (result: ImportResult): Promise<void> => {
    await fetchProfiles();
    if (result.id) {
      setSelectedId(result.id);
      setShowImportExport(false);
    }
  };

  const handleSave = async (data: ProfileFormData): Promise<void> => {
    try {
      if (isCreating) {
        const created = await profilesApi.create<ProfileData, ProfileFormData>(data);
        await fetchProfiles();
        setSelectedId(created.id);
        setIsCreating(false);
      } else if (selectedId) {
        await profilesApi.update<Record<string, unknown>, ProfileFormData>(selectedId, data);
        await fetchProfileDetails(selectedId);
        setIsEditing(false);
        await fetchProfiles();
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Ошибка при сохранении профиля: " + getApiErrorMessage(err));
    }
  };

  const handleDuplicate = async (): Promise<void> => {
    if (!selectedId) return;
    try {
      const duplicated = await profilesApi.duplicate<ProfileData>(selectedId);
      await fetchProfiles();
      setSelectedId(duplicated.id);
    } catch (err) {
      console.error("Error duplicating profile:", err);
      alert("Ошибка при дублировании: " + getApiErrorMessage(err));
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    try {
      if (!selectedId) return;
      await profilesApi.remove(selectedId);
      setDeleteDialogOpen(false);
      const data = await profilesApi.list<Profile>();
      setProfiles(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      } else {
        setSelectedId(null);
        setProfileData(null);
      }
    } catch (err) {
      console.error("Error deleting profile:", err);
      alert("Ошибка при удалении: " + getApiErrorMessage(err));
      setDeleteDialogOpen(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesCategory = categoryTab === "all" || profile.category === categoryTab;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      profile.name.toLowerCase().includes(query) ||
      (profile.description && profile.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const categoryCounts: CategoryCounts = {
    all: profiles.length,
    gost: profiles.filter((profile) => profile.category === "gost").length,
    university: profiles.filter((profile) => profile.category === "university").length,
    custom: profiles.filter((profile) => profile.category === "custom").length,
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Все профили",
        value: categoryCounts.all,
        hint: "Общее количество профилей в системе.",
      },
      {
        label: "Системные",
        value: profiles.filter((profile) => profile.is_system).length,
        hint: "Базовые профили CURSA и ГОСТ.",
      },
      {
        label: "Пользовательские",
        value: categoryCounts.custom,
        hint: "Профили, созданные пользователями.",
      },
    ],
    [categoryCounts.all, categoryCounts.custom, profiles],
  );

  const activeUtilityMode =
    showComparison || showImportExport || showStatistics || showBulkOperations;

  if (loading) {
    return (
      <AppPageLayout title="Профили оформления" contentClassName="gap-4 md:gap-6">
        <Card className={cn(pagePanelClass, "rounded-[2rem]")}>
          <CardContent className="flex min-h-[360px] items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </AppPageLayout>
    );
  }

  return (
    <TooltipProvider>
      <AppPageLayout title="Профили оформления" contentClassName="gap-4 md:gap-6">
        <Card
          className={cn(
            pagePanelClass,
            "overflow-hidden rounded-[2rem] border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]",
          )}
        >
          <CardContent className="flex flex-col gap-5 p-6 md:p-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Общее количество профилей
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] text-foreground md:text-4xl">
                Подберите шаблон, сравните правила и соберите собственный профиль оформления.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Экран переведен на общий shadcn/Tailwind-язык CURSA: чистые surface-карточки, единая
                иерархия действий и без MUI-обвязки на уровне страницы.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-[#2e2f2f] bg-[#171717] px-3 py-1 text-xs font-semibold text-[#b6b6b6]"
                >
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {categoryCounts.gost} ГОСТ
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#2e2f2f] bg-[#171717] px-3 py-1 text-xs font-semibold text-[#b6b6b6]"
                >
                  <School className="mr-1 h-3.5 w-3.5" />
                  {categoryCounts.university} Университет
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#2e2f2f] bg-[#171717] px-3 py-1 text-xs font-semibold text-[#b6b6b6]"
                >
                  <FolderKanban className="mr-1 h-3.5 w-3.5" />
                  {categoryCounts.custom} Пользовательские
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:max-w-[420px] xl:justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showComparison ? "secondary" : "outline"}
                    size="icon"
                    onClick={handleShowComparison}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Сравнить профили</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showImportExport ? "secondary" : "outline"}
                    size="icon"
                    onClick={handleShowImportExport}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Импорт и экспорт</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showStatistics ? "secondary" : "outline"}
                    size="icon"
                    onClick={handleShowStatistics}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Статистика</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showBulkOperations ? "secondary" : "outline"}
                    size="icon"
                    onClick={handleShowBulkOperations}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Массовые операции</TooltipContent>
              </Tooltip>
              <Button
                id="create-profile-btn"
                data-testid="create-profile-btn"
                onClick={() => handleCreateStart()}
                disabled={isCreating}
                className="rounded-full px-5 font-semibold"
              >
                <Plus className="h-4 w-4" />
                Создать профиль
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
          ))}
        </div>

        <div className="grid min-h-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className={cn(pagePanelClass, "min-h-[480px] rounded-[2rem]")}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold tracking-[-0.03em]">
                    Каталог профилей
                  </CardTitle>
                  <CardDescription>Фильтруйте и выбирайте активный шаблон.</CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-[#2e2f2f] bg-[#222222] px-2.5 py-1 text-xs text-[#b6b6b6]"
                >
                  {filteredProfiles.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex h-full min-h-0 flex-col gap-4">
              <Tabs
                value={categoryTab}
                onValueChange={(value) => setCategoryTab(value as typeof categoryTab)}
              >
                <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-[#2e2f2f] bg-[#222222] p-1">
                  <TabsTrigger value="all" className="rounded-xl">
                    Все {categoryCounts.all}
                  </TabsTrigger>
                  <TabsTrigger value="gost" className="rounded-xl">
                    ГОСТ
                  </TabsTrigger>
                  <TabsTrigger value="university" className="rounded-xl">
                    ВУЗы
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={() => undefined}
                placeholder="Поиск профилей..."
                buttonLabel="Поиск"
                inputClassName="h-11 rounded-2xl border-[#2e2f2f] bg-[#171717] text-[#fafafa] placeholder:text-[#7b7b7b]"
                buttonClassName="h-11 rounded-2xl px-4"
              />

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {filteredProfiles.map((profile, index) => {
                  const isActive = selectedId === profile.id && !isCreating;

                  return (
                    <motion.button
                      key={profile.id}
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.025 }}
                      onClick={() => {
                        setSelectedId(profile.id);
                        setIsCreating(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                        isActive
                          ? "border-[#2e2f2f] bg-[#222222] text-[#fafafa]"
                          : "border-transparent bg-[#171717] hover:border-[#2e2f2f] hover:bg-[#222222]",
                      )}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2e2f2f] bg-[#171717] text-[#b6b6b6]">
                        {getCategoryIcon(profile.category, "h-4 w-4")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {profile.name}
                          </p>
                          {profile.is_system ? (
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {profile.university || profile.version || "Без доп. метаданных"}
                        </p>
                        {profile.description ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {profile.description}
                          </p>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}

                {!filteredProfiles.length ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#2e2f2f] bg-[#171717] p-6 text-center text-sm text-[#b6b6b6]">
                    По этому фильтру профили не найдены.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="min-h-0">
            {entryContext && !activeUtilityMode ? (
              <Card className={cn(pagePanelClass, "mb-4 rounded-[1.75rem]")}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm leading-6 text-foreground">{entryContext.message}</p>
                </CardContent>
              </Card>
            ) : null}

            <AnimatePresence mode="wait">
              {showComparison ? (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                >
                  <ProfileComparison profiles={profiles} onClose={() => setShowComparison(false)} />
                </motion.div>
              ) : showImportExport ? (
                <motion.div
                  key="import-export"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                >
                  <ProfileImportExport
                    profiles={profiles}
                    onImport={handleImportSuccess}
                    onRefresh={fetchProfiles}
                    onClose={() => setShowImportExport(false)}
                  />
                </motion.div>
              ) : showStatistics ? (
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                >
                  <ProfileStatistics profiles={profiles} onClose={() => setShowStatistics(false)} />
                </motion.div>
              ) : showBulkOperations ? (
                <motion.div
                  key="bulk"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                >
                  <ProfileBulkOperations
                    profiles={profiles}
                    onClose={() => setShowBulkOperations(false)}
                    onRefresh={fetchProfiles}
                  />
                </motion.div>
              ) : isCreating || isEditing ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                >
                  <ProfileEditor
                    initialData={isEditing ? profileData : editorSeed}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </motion.div>
              ) : loadingDetails || !profileData ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className={cn(pagePanelClass, "rounded-[2rem]")}>
                    <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
                      {loadingDetails ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : error ? (
                        <>
                          <AlertCircle className="h-8 w-8 text-destructive" />
                          <div>
                            <p className="text-lg font-semibold text-destructive">{error}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Не удалось показать детали профиля.
                            </p>
                          </div>
                          {selectedId ? (
                            <Button
                              variant="outline"
                              onClick={() => fetchProfileDetails(selectedId)}
                            >
                              Повторить
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Ruler className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Выберите профиль из списка слева.
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <Card className={cn(pagePanelClass, "rounded-[2rem]")}>
                    <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-3xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Активный профиль
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground">
                          {profileData.name}
                        </h2>
                        {profileData.description ? (
                          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                            {profileData.description}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full px-3 py-1">
                            {getCategoryLabel(profileData.category)}
                          </Badge>
                          {profileData.university ? (
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {profileData.university}
                            </Badge>
                          ) : null}
                          {profileData.extends ? (
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              Наследует: {profileData.extends}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleDuplicate}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Дублировать</TooltipContent>
                        </Tooltip>
                        {!profileData.is_system ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleEditStart}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Редактировать</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setDeleteDialogOpen(true)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Удалить</TooltipContent>
                            </Tooltip>
                          </>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <ProfileValidation profileId={selectedId!} profileName={profileData.name} />
                  </div>

                  <div>
                    <ProfileHistory
                      profileId={selectedId!}
                      profileName={profileData.name}
                      isSystemProfile={profileData.is_system || false}
                      onRestore={() => fetchProfileDetails(selectedId!)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <RuleCard
                      title="Шрифт и текст"
                      icon={<Type className="h-4 w-4" />}
                      delay={0.05}
                    >
                      <RuleItem label="Гарнитура" value={profileData.rules.font.name} />
                      <RuleItem label="Размер" value={`${profileData.rules.font.size} пт`} />
                      <RuleItem
                        label="Цвет"
                        value={
                          profileData.rules.font.color === "000000"
                            ? "Чёрный"
                            : profileData.rules.font.color
                        }
                      />
                      <Separator className="my-1" />
                      <RuleItem label="Межстрочный" value={`${profileData.rules.line_spacing}x`} />
                      <RuleItem
                        label="Отступ первой строки"
                        value={`${profileData.rules.first_line_indent} см`}
                      />
                      <RuleItem
                        label="Выравнивание"
                        value={getAlignmentLabel(profileData.rules.paragraph_alignment)}
                      />
                    </RuleCard>

                    <RuleCard
                      title="Поля страницы"
                      icon={<Ruler className="h-4 w-4" />}
                      delay={0.1}
                    >
                      <RuleItem label="Левое" value={`${profileData.rules.margins.left} см`} />
                      <RuleItem label="Правое" value={`${profileData.rules.margins.right} см`} />
                      <RuleItem label="Верхнее" value={`${profileData.rules.margins.top} см`} />
                      <RuleItem label="Нижнее" value={`${profileData.rules.margins.bottom} см`} />
                    </RuleCard>

                    <RuleCard
                      title="Заголовки"
                      icon={<ListTree className="h-4 w-4" />}
                      delay={0.15}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Уровень 1
                      </p>
                      <RuleItem
                        label="Размер"
                        value={`${profileData.rules.headings.h1.font_size} пт`}
                      />
                      <RuleItem
                        label="Выравнивание"
                        value={getAlignmentLabel(profileData.rules.headings.h1.alignment)}
                      />
                      <RuleItem
                        label="Интервал после"
                        value={`${profileData.rules.headings.h1.space_after || 0} пт`}
                      />
                      <Separator className="my-1" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Уровень 2
                      </p>
                      <RuleItem
                        label="Размер"
                        value={`${profileData.rules.headings.h2.font_size} пт`}
                      />
                      <RuleItem
                        label="Отступ"
                        value={`${profileData.rules.headings.h2.first_line_indent || 0} см`}
                      />
                    </RuleCard>

                    <RuleCard
                      title="Таблицы и подписи"
                      icon={<Table2 className="h-4 w-4" />}
                      delay={0.2}
                    >
                      <RuleItem
                        label="Шрифт таблиц"
                        value={`${profileData.rules.tables.font_size} пт`}
                      />
                      <RuleItem
                        label="Интервал таблиц"
                        value={`${profileData.rules.tables.line_spacing}x`}
                      />
                      <Separator className="my-1" />
                      <RuleItem
                        label="Шрифт подписей"
                        value={`${profileData.rules.captions.font_size} пт`}
                      />
                      <RuleItem
                        label="Разделитель"
                        value={`"${profileData.rules.captions.separator}"`}
                      />
                      <RuleItem
                        label="Выравнивание"
                        value={getAlignmentLabel(profileData.rules.captions.alignment)}
                      />
                    </RuleCard>

                    <RuleCard
                      title="Списки и сноски"
                      icon={<LayoutList className="h-4 w-4" />}
                      delay={0.25}
                    >
                      <RuleItem
                        label="Шрифт списков"
                        value={`${profileData.rules.lists.font_size} пт`}
                      />
                      <RuleItem
                        label="Отступ слева"
                        value={`${profileData.rules.lists.left_indent} см`}
                      />
                      <Separator className="my-1" />
                      <RuleItem
                        label="Шрифт сносок"
                        value={`${profileData.rules.footnotes.font_size} пт`}
                      />
                      <RuleItem
                        label="Интервал сносок"
                        value={`${profileData.rules.footnotes.line_spacing}x`}
                      />
                    </RuleCard>

                    {profileData.rules.bibliography ? (
                      <RuleCard
                        title="Библиография"
                        icon={<BookMarked className="h-4 w-4" />}
                        delay={0.3}
                      >
                        <RuleItem
                          label="Стиль"
                          value={
                            profileData.rules.bibliography.style === "gost"
                              ? "ГОСТ"
                              : profileData.rules.bibliography.style
                          }
                        />
                        <RuleItem
                          label="Размер шрифта"
                          value={`${profileData.rules.bibliography.font_size || 14} пт`}
                        />
                        <RuleItem
                          label="Сортировка"
                          value={
                            profileData.rules.bibliography.sort_order === "alphabetical"
                              ? "По алфавиту"
                              : profileData.rules.bibliography.sort_order
                          }
                        />
                        <Separator className="my-1" />
                        <RuleItem
                          label="Мин. источников"
                          value={profileData.rules.bibliography.min_sources || 15}
                        />
                        <RuleItem
                          label="Макс. возраст"
                          value={`${profileData.rules.bibliography.max_age_years || 5} лет`}
                        />
                      </RuleCard>
                    ) : null}

                    <RuleCard
                      title="Структура"
                      icon={<FileText className="h-4 w-4" />}
                      delay={0.35}
                    >
                      <p className="text-sm text-muted-foreground">Обязательные разделы:</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.rules.required_sections.map((section, index) => (
                          <Badge
                            key={`${section}-${index}`}
                            variant="outline"
                            className="rounded-xl px-3 py-1 text-xs font-medium"
                          >
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </RuleCard>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить профиль?</DialogTitle>
              <DialogDescription>
                Вы действительно хотите удалить профиль "{profileData?.name}"? Это действие нельзя
                отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppPageLayout>
    </TooltipProvider>
  );
};

export default ProfilesPage;
