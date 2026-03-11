import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  LayoutList,
  Loader2,
  ShieldAlert,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";

import { getApiErrorMessage, profilesApi } from "../api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const getResultStatus = (result) => {
  if (!result) return null;
  if (result.status === "valid") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (result.status === "warning") return <ShieldAlert className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

export default function ProfileBulkOperations({ profiles, onRefresh, onClose }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("custom");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAllSelected = selected.length === profiles.length && profiles.length > 0;

  const handleSelectAll = () => {
    setSelected((previous) =>
      previous.length === profiles.length ? [] : profiles.map((profile) => profile.id),
    );
  };

  const handleSelect = (id) => {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const handleValidateAll = async () => {
    setValidating(true);
    setError(null);
    setSuccess(null);
    const results = {};

    for (const profileId of selected) {
      try {
        const response = await profilesApi.validate(profileId);
        results[profileId] = {
          status: response.valid ? "valid" : response.warnings?.length > 0 ? "warning" : "error",
          errors: response.errors || response.issues || [],
          warnings: response.warnings || [],
        };
      } catch (err) {
        results[profileId] = {
          status: "error",
          errors: [getApiErrorMessage(err, "Ошибка валидации")],
          warnings: [],
        };
      }
    }

    setValidationResults(results);
    setValidating(false);
    setSuccess(`Валидация завершена для ${selected.length} профилей.`);
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    let deleted = 0;
    let failed = 0;

    for (const profileId of selected) {
      try {
        await profilesApi.remove(profileId);
        deleted += 1;
      } catch (err) {
        failed += 1;
      }
    }

    setLoading(false);
    setDeleteDialogOpen(false);
    setSelected([]);
    if (deleted > 0) setSuccess(`Удалено ${deleted} профилей.`);
    if (failed > 0) setError(`Не удалось удалить ${failed} профилей.`);
    if (onRefresh) onRefresh();
  };

  const handleBulkCategoryChange = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    let updated = 0;
    let failed = 0;

    for (const profileId of selected) {
      try {
        const profile = await profilesApi.getById(profileId);
        await profilesApi.update(profileId, { ...profile, category: newCategory });
        updated += 1;
      } catch (err) {
        failed += 1;
      }
    }

    setLoading(false);
    setCategoryDialogOpen(false);
    if (updated > 0) setSuccess(`Обновлено ${updated} профилей.`);
    if (failed > 0) setError(`Не удалось обновить ${failed} профилей.`);
    if (onRefresh) onRefresh();
  };

  const handleDuplicate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    let duplicated = 0;
    let failed = 0;

    for (const profileId of selected) {
      try {
        await profilesApi.duplicate(profileId);
        duplicated += 1;
      } catch (err) {
        failed += 1;
      }
    }

    setLoading(false);
    if (duplicated > 0) setSuccess(`Дублировано ${duplicated} профилей.`);
    if (failed > 0) setError(`Не удалось дублировать ${failed} профилей.`);
    if (onRefresh) onRefresh();
  };

  const filteredProfiles = useMemo(() => {
    if (filterStatus === "all") return profiles;
    return profiles.filter((profile) => {
      const result = validationResults[profile.id];
      if (!result) return filterStatus === "unchecked";
      return result.status === filterStatus;
    });
  }, [filterStatus, profiles, validationResults]);

  const stats = useMemo(() => {
    const base = { total: profiles.length, valid: 0, warning: 0, error: 0, unchecked: 0 };
    profiles.forEach((profile) => {
      const result = validationResults[profile.id];
      if (!result) base.unchecked += 1;
      else if (result.status === "valid") base.valid += 1;
      else if (result.status === "warning") base.warning += 1;
      else base.error += 1;
    });
    return base;
  }, [profiles, validationResults]);

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <CardHeader className="border-b border-border/60 bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <LayoutList className="h-5 w-5 text-muted-foreground" />
              Массовые операции
            </CardTitle>
            <CardDescription>
              Проверьте, дублируйте, переклассифицируйте или удалите сразу несколько профилей.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 ? (
              <Badge className="rounded-full">Выбрано: {selected.length}</Badge>
            ) : null}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {isAllSelected ? "Снять выбор" : "Выбрать все"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleValidateAll}
            disabled={selected.length === 0 || validating}
          >
            {validating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Проверить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryDialogOpen(true)}
            disabled={selected.length === 0 || loading}
          >
            <Tag className="h-4 w-4" />
            Категория
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={selected.length === 0 || loading}
          >
            <Copy className="h-4 w-4" />
            Дублировать
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={selected.length === 0 || loading}
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </Button>
        </div>

        {Object.keys(validationResults).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filterStatus === "valid" ? "default" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={() => setFilterStatus(filterStatus === "valid" ? "all" : "valid")}
            >
              Валидных: {stats.valid}
            </Badge>
            <Badge
              variant={filterStatus === "warning" ? "default" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={() => setFilterStatus(filterStatus === "warning" ? "all" : "warning")}
            >
              Предупр.: {stats.warning}
            </Badge>
            <Badge
              variant={filterStatus === "error" ? "destructive" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={() => setFilterStatus(filterStatus === "error" ? "all" : "error")}
            >
              Ошибок: {stats.error}
            </Badge>
            <Badge
              variant={filterStatus === "unchecked" ? "secondary" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={() => setFilterStatus(filterStatus === "unchecked" ? "all" : "unchecked")}
            >
              Не проверено: {stats.unchecked}
            </Badge>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
          <div className="grid grid-cols-[44px_minmax(220px,1fr)_140px_64px_minmax(180px,1fr)] gap-3 border-b border-border/60 bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <div />
            <div>Название</div>
            <div>Категория</div>
            <div className="text-center">Статус</div>
            <div>Детали</div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => {
                const result = validationResults[profile.id];
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelect(profile.id)}
                    className={[
                      "grid w-full grid-cols-[44px_minmax(220px,1fr)_140px_64px_minmax(180px,1fr)] items-start gap-3 border-b border-border/60 px-4 py-3 text-left text-sm transition-colors last:border-b-0",
                      selected.includes(profile.id)
                        ? "bg-accent/60"
                        : "bg-background hover:bg-muted/25",
                    ].join(" ")}
                  >
                    <div className="pt-1">
                      <Checkbox
                        checked={selected.includes(profile.id)}
                        onCheckedChange={() => handleSelect(profile.id)}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{profile.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profile.description || "—"}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="rounded-full">
                        {profile.category === "university" ? "ВУЗ" : "Пользов."}
                      </Badge>
                    </div>
                    <div className="flex justify-center pt-1">
                      {getResultStatus(result) || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="text-xs leading-5 text-muted-foreground">
                      {result
                        ? result.errors?.length > 0
                          ? result.errors[0]
                          : result.warnings?.length > 0
                            ? result.warnings[0]
                            : "Все в порядке"
                        : "Не проверено"}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                {profiles.length === 0 ? "Нет профилей." : "Нет профилей с выбранным статусом."}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить {selected.length} профилей? Это действие нельзя
              отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить категорию</DialogTitle>
            <DialogDescription>
              Примените новую категорию ко всем выбранным профилям.
            </DialogDescription>
          </DialogHeader>
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Пользовательский</SelectItem>
              <SelectItem value="university">Требования ВУЗа</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleBulkCategoryChange} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

ProfileBulkOperations.propTypes = {
  profiles: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
