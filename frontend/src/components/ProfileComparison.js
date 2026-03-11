import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  CopyMinus,
  SearchX,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

import { getApiErrorMessage, profilesApi } from "../api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "font", label: "Шрифт" },
  { id: "margins", label: "Поля" },
  { id: "paragraph", label: "Абзац" },
  { id: "headings", label: "Заголовки" },
  { id: "tables", label: "Таблицы" },
  { id: "bibliography", label: "Библиография" },
];

const FIELD_LABELS = {
  "font.name": "Гарнитура",
  "font.size": "Размер шрифта",
  "font.color": "Цвет",
  "margins.left": "Левое поле",
  "margins.right": "Правое поле",
  "margins.top": "Верхнее поле",
  "margins.bottom": "Нижнее поле",
  line_spacing: "Межстрочный интервал",
  first_line_indent: "Абзацный отступ",
  paragraph_alignment: "Выравнивание",
  "headings.h1.font_size": "H1 - Размер",
  "headings.h1.bold": "H1 - Жирный",
  "headings.h1.alignment": "H1 - Выравнивание",
  "headings.h1.all_caps": "H1 - Прописные",
  "headings.h2.font_size": "H2 - Размер",
  "headings.h2.bold": "H2 - Жирный",
  "headings.h2.alignment": "H2 - Выравнивание",
  "headings.h3.font_size": "H3 - Размер",
  "headings.h3.bold": "H3 - Жирный",
  tables: "Таблицы",
  "tables.font_size": "Шрифт таблиц",
  "tables.line_spacing": "Интервал таблиц",
  "tables.borders": "Границы",
  "captions.font_size": "Шрифт подписей",
  "captions.separator": "Разделитель",
  "bibliography.style": "Стиль",
  "bibliography.min_sources": "Мин. источников",
  "bibliography.max_age_years": "Макс. возраст",
};

const getFieldCategory = (path) => {
  if (path.startsWith("font")) return "font";
  if (path.startsWith("margins")) return "margins";
  if (path.includes("line_spacing") || path.includes("indent") || path.includes("alignment")) {
    return "paragraph";
  }
  if (path.startsWith("headings")) return "headings";
  if (path.startsWith("tables") || path.startsWith("captions")) return "tables";
  if (path.startsWith("bibliography")) return "bibliography";
  return "other";
};

const flattenObject = (obj, prefix = "") => {
  const result = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
};

const formatValue = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (value === "JUSTIFY") return "По ширине";
  if (value === "LEFT") return "Слева";
  if (value === "CENTER") return "По центру";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

export default function ProfileComparison({ profiles, onClose }) {
  const [profile1Id, setProfile1Id] = useState("");
  const [profile2Id, setProfile2Id] = useState("");
  const [profile1Data, setProfile1Data] = useState(null);
  const [profile2Data, setProfile2Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showOnlyDiff, setShowOnlyDiff] = useState(false);

  useEffect(() => {
    if (profiles.length >= 2) {
      setProfile1Id(profiles[0].id);
      setProfile2Id(profiles[1].id);
    }
  }, [profiles]);

  const handleCompare = async () => {
    if (!profile1Id || !profile2Id) return;
    setLoading(true);
    setError(null);
    try {
      const [data1, data2] = await Promise.all([
        profilesApi.getById(profile1Id),
        profilesApi.getById(profile2Id),
      ]);
      setProfile1Data(data1);
      setProfile2Data(data2);
    } catch (err) {
      setError(getApiErrorMessage(err, "Ошибка сравнения профилей"));
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setProfile1Id(profile2Id);
    setProfile2Id(profile1Id);
    setProfile1Data(profile2Data);
    setProfile2Data(profile1Data);
  };

  const differences = useMemo(() => {
    if (!profile1Data?.rules || !profile2Data?.rules) return [];

    const flat1 = flattenObject(profile1Data.rules);
    const flat2 = flattenObject(profile2Data.rules);
    const allKeys = new Set([...Object.keys(flat1), ...Object.keys(flat2)]);

    return [...allKeys]
      .map((key) => ({
        path: key,
        label: FIELD_LABELS[key] || key,
        value1: flat1[key],
        value2: flat2[key],
        category: getFieldCategory(key),
        isDifferent: JSON.stringify(flat1[key]) !== JSON.stringify(flat2[key]),
      }))
      .sort((left, right) => left.category.localeCompare(right.category));
  }, [profile1Data, profile2Data]);

  const stats = useMemo(() => {
    const total = differences.length;
    const different = differences.filter((item) => item.isDifferent).length;
    const same = total - different;
    return {
      total,
      different,
      same,
      percent: total > 0 ? Math.round((same / total) * 100) : 100,
    };
  }, [differences]);

  const filteredDifferences = useMemo(() => {
    return differences.filter((item) => {
      if (activeTab !== "all" && item.category !== activeTab) return false;
      if (showOnlyDiff && !item.isDifferent) return false;
      return true;
    });
  }, [activeTab, differences, showOnlyDiff]);

  const categoryStats = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((category) => {
      if (category.id === "all") return;
      const items = differences.filter((item) => item.category === category.id);
      map[category.id] = items.filter((item) => item.isDifferent).length;
    });
    return map;
  }, [differences]);

  return (
    <TooltipProvider>
      <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <CardHeader className="border-b border-border/60 bg-muted/25">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                Сравнение профилей
              </CardTitle>
              <CardDescription>
                Сопоставьте два шаблона по правилам оформления и найдите расхождения.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto]">
            <Select
              value={profile1Id}
              onValueChange={(value) => {
                setProfile1Id(value);
                setProfile1Data(null);
              }}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Профиль 1" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem
                    key={profile.id}
                    value={profile.id}
                    disabled={profile.id === profile2Id}
                  >
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleSwap}>
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Поменять местами</TooltipContent>
            </Tooltip>

            <Select
              value={profile2Id}
              onValueChange={(value) => {
                setProfile2Id(value);
                setProfile2Data(null);
              }}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Профиль 2" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem
                    key={profile.id}
                    value={profile.id}
                    disabled={profile.id === profile1Id}
                  >
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleCompare}
              disabled={!profile1Id || !profile2Id || loading}
              className="rounded-2xl"
            >
              {loading ? "Сравниваем..." : "Сравнить"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {profile1Data && profile2Data ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div>
                  <p className="text-3xl font-black tracking-[-0.04em] text-foreground">
                    {stats.percent}%
                  </p>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Совпадение
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Badge variant="outline" className="rounded-full">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {stats.same} совпадает
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-destructive/30 text-destructive"
                  >
                    <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                    {stats.different} различий
                  </Badge>
                  <Button
                    variant={showOnlyDiff ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyDiff((previous) => !previous)}
                  >
                    <CopyMinus className="h-4 w-4" />
                    Только различия
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-transparent p-0">
                  {CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="rounded-full border border-border/70 bg-background px-4 py-2 data-[state=active]:border-primary/30 data-[state=active]:bg-accent"
                    >
                      {category.label}
                      {category.id !== "all" && categoryStats[category.id] ? (
                        <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                          {categoryStats[category.id]}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                <div className="grid grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_90px] border-b border-border/70 bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <div>Параметр</div>
                  <div>{profile1Data.name}</div>
                  <div>{profile2Data.name}</div>
                  <div className="text-center">Статус</div>
                </div>
                <div className="max-h-[560px] overflow-auto">
                  <AnimatePresence>
                    {filteredDifferences.length > 0 ? (
                      filteredDifferences.map((difference, index) => (
                        <motion.div
                          key={difference.path}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.01 }}
                          className={[
                            "grid grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_90px] items-start gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-b-0",
                            difference.isDifferent ? "bg-destructive/5" : "bg-background",
                          ].join(" ")}
                        >
                          <div>
                            <p
                              className={
                                difference.isDifferent
                                  ? "font-semibold text-foreground"
                                  : "text-foreground"
                              }
                            >
                              {difference.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{difference.path}</p>
                          </div>
                          <div className="font-mono text-xs leading-6 text-foreground">
                            {formatValue(difference.value1)}
                          </div>
                          <div className="font-mono text-xs leading-6 text-foreground">
                            {formatValue(difference.value2)}
                          </div>
                          <div className="flex justify-center pt-1">
                            {difference.isDifferent ? (
                              <XCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-muted-foreground">
                        <SearchX className="h-8 w-8" />
                        {showOnlyDiff
                          ? "Различий не найдено."
                          : "Нет данных для выбранной категории."}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-border/70 bg-muted/20 text-center text-muted-foreground">
              <ArrowLeftRight className="h-10 w-10" />
              <p className="text-sm">Выберите два профиля и запустите сравнение.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

ProfileComparison.propTypes = {
  profiles: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};
