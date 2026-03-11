import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clipboard, Download, FileJson, Trash2, Upload, X } from "lucide-react";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import { getApiErrorMessage, profilesApi } from "../api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const downloadJsonFile = (payload, fileName) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const validateProfileData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push("Отсутствует или некорректное название профиля");
  }
  if (!data.rules || typeof data.rules !== "object") {
    errors.push("Отсутствуют правила оформления");
  } else {
    if (!data.rules.font) warnings.push("Не заданы настройки шрифта");
    if (!data.rules.margins) warnings.push("Не заданы поля страницы");
    if (!data.rules.headings) warnings.push("Не заданы настройки заголовков");
  }

  return { valid: errors.length === 0, errors, warnings };
};

export default function ProfileImportExport({ profiles, onImport, onClose, onRefresh }) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("import");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = async (files) => {
    const jsonFiles = files.filter((file) => file.name.endsWith(".json"));
    if (jsonFiles.length === 0) {
      setError("Пожалуйста, выберите JSON-файлы.");
      return;
    }

    const processed = [];
    for (const file of jsonFiles) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const validation = validateProfileData(data);
        processed.push({ file, name: file.name, data, validation, selected: validation.valid });
      } catch (err) {
        processed.push({
          file,
          name: file.name,
          data: null,
          validation: { valid: false, errors: ["Некорректный JSON-формат"], warnings: [] },
          selected: false,
        });
      }
    }

    setPendingFiles(processed);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    void processFiles(Array.from(event.dataTransfer.files));
  };

  const handleImport = async () => {
    const filesToImport = pendingFiles.filter((item) => item.selected && item.validation.valid);
    if (filesToImport.length === 0) {
      setError("Нет валидных файлов для импорта.");
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;
    let lastCreated = null;

    for (const item of filesToImport) {
      try {
        lastCreated = await profilesApi.create(item.data);
        successCount += 1;
      } catch (err) {
        failCount += 1;
      }
    }

    setImporting(false);
    if (successCount > 0) {
      setSuccess(`Успешно импортировано: ${successCount}`);
      setPendingFiles([]);
      if (onRefresh) onRefresh();
      if (onImport && lastCreated) onImport(lastCreated);
    }
    if (failCount > 0) {
      setError(`Не удалось импортировать: ${failCount}`);
    }
  };

  const handleExport = async () => {
    if (selectedProfiles.length === 0) return;
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedData = await Promise.all(
        selectedProfiles.map((profileId) => profilesApi.getById(profileId)),
      );
      if (selectedData.length === 1) {
        const [profile] = selectedData;
        downloadJsonFile(profile, `${profile.name.replace(/\s+/g, "_")}.json`);
      } else {
        downloadJsonFile(
          selectedData,
          `profiles_export_${new Date().toISOString().split("T")[0]}.json`,
        );
      }
      setSuccess("Экспорт завершён.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Ошибка экспорта"));
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = async (profile) => {
    try {
      const fullProfile = await profilesApi.getById(profile.id);
      await navigator.clipboard.writeText(JSON.stringify(fullProfile, null, 2));
      setSuccess(`Профиль "${profile.name}" скопирован в буфер.`);
    } catch (err) {
      setError("Ошибка копирования JSON.");
    }
  };

  const toggleFileSelection = (index) => {
    setPendingFiles((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const removeFile = (index) => {
    setPendingFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleProfileSelection = (id) => {
    setSelectedProfiles((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const selectAllProfiles = () => {
    setSelectedProfiles((previous) =>
      previous.length === profiles.length ? [] : profiles.map((profile) => profile.id),
    );
  };

  return (
    <TooltipProvider>
      <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <CardHeader className="border-b border-border/60 bg-muted/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="h-5 w-5 text-muted-foreground" />
                Импорт и экспорт
              </CardTitle>
              <CardDescription>
                Загружайте JSON-профили или выгружайте выбранные шаблоны из библиотеки.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            ) : null}
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
              >
                {success}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="import" className="rounded-xl">
                Импорт
              </TabsTrigger>
              <TabsTrigger value="export" className="rounded-xl">
                Экспорт
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "import" ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                multiple
                className="hidden"
                onChange={(event) => {
                  void processFiles(Array.from(event.target.files || []));
                }}
              />

              <button
                type="button"
                onDrop={handleDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "flex w-full flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-accent/60"
                    : "border-border/70 bg-muted/15 hover:bg-accent/40",
                ].join(" ")}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {dragOver ? "Отпустите файлы для импорта" : "Перетащите JSON-файлы сюда"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    или нажмите, чтобы выбрать их вручную
                  </p>
                </div>
              </button>

              {pendingFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      Файлы для импорта:{" "}
                      {pendingFiles.filter((item) => item.selected && item.validation.valid).length}{" "}
                      из {pendingFiles.length}
                    </p>
                    <Button
                      onClick={handleImport}
                      disabled={
                        importing ||
                        pendingFiles.filter((item) => item.selected && item.validation.valid)
                          .length === 0
                      }
                    >
                      <Upload className="h-4 w-4" />
                      {importing ? "Импорт..." : "Импортировать"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {pendingFiles.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                      >
                        <Checkbox
                          checked={item.selected && item.validation.valid}
                          onCheckedChange={() => toggleFileSelection(index)}
                          disabled={!item.validation.valid}
                          className="mt-1"
                        />
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 text-muted-foreground">
                          <FileJson className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {item.data?.name || item.name}
                            </p>
                            <Badge
                              variant={item.validation.valid ? "secondary" : "destructive"}
                              className="rounded-full"
                            >
                              {item.validation.valid ? "Валидный" : "Ошибка"}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-xs">
                            {item.validation.errors.map((validationError, itemIndex) => (
                              <p key={`error-${itemIndex}`} className="text-destructive">
                                • {validationError}
                              </p>
                            ))}
                            {item.validation.warnings.map((warning, itemIndex) => (
                              <p
                                key={`warning-${itemIndex}`}
                                className="text-amber-600 dark:text-amber-400"
                              >
                                ⚠ {warning}
                              </p>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Выберите профили для экспорта
                </p>
                <Button variant="outline" size="sm" onClick={selectAllProfiles}>
                  {selectedProfiles.length === profiles.length ? "Снять выбор" : "Выбрать все"}
                </Button>
              </div>

              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <Checkbox
                      checked={selectedProfiles.includes(profile.id)}
                      onCheckedChange={() => toggleProfileSelection(profile.id)}
                      className="mt-1"
                    />
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 text-muted-foreground">
                      <FileJson className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profile.description || "Без описания"}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(profile)}
                        >
                          <Clipboard className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Скопировать JSON</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleExport}
                disabled={exporting || selectedProfiles.length === 0}
                className="w-full rounded-2xl"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Экспорт..." : `Экспортировать (${selectedProfiles.length})`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

ProfileImportExport.propTypes = {
  profiles: PropTypes.array.isRequired,
  onImport: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
};
