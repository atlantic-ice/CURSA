import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage, profilesApi } from "../api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

export default function ProfileValidation({ profileId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(true);

  const validate = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      const data = await profilesApi.validate(profileId);
      setResult(data);
    } catch (err) {
      console.error("Error validating profile:", err);
      setResult({
        valid: false,
        issues: [getApiErrorMessage(err, "Ошибка валидации")],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      validate();
    }
  }, [profileId, validate]);

  if (!profileId) return null;

  const issuesCount = result?.issues?.length || 0;
  const warningsCount = result?.warnings?.length || 0;
  const hasDetails = issuesCount > 0 || warningsCount > 0;

  return (
    <Card
      className={[
        "rounded-[1.75rem] border-border/70 shadow-[0_18px_48px_rgba(15,23,42,0.05)]",
        result?.valid ? "bg-emerald-500/5" : result ? "bg-destructive/5" : "bg-card/90",
      ].join(" ")}
    >
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Валидация профиля</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Проверка структуры, наследования и обязательных правил.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={validate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Проверить
          </Button>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Проверка...
          </div>
        ) : result ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {result.valid ? (
                <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Профиль валиден
                </Badge>
              ) : (
                <Badge variant="destructive" className="rounded-full">
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Обнаружены проблемы
                </Badge>
              )}

              {issuesCount > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-destructive/30 text-destructive"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  {issuesCount} ошибок
                </Badge>
              ) : null}

              {warningsCount > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                  {warningsCount} предупреждений
                </Badge>
              ) : null}

              {hasDetails ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setShowDetails((previous) => !previous)}
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showDetails ? "Скрыть" : "Подробнее"}
                </Button>
              ) : null}
            </div>

            {showDetails ? (
              <div className="space-y-4">
                {issuesCount > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
                      Ошибки
                    </p>
                    <div className="mt-2 space-y-2">
                      {result.issues.map((issue, index) => (
                        <div
                          key={`${issue}-${index}`}
                          className="flex items-start gap-2 rounded-2xl border border-destructive/15 bg-destructive/5 px-3 py-2 text-sm"
                        >
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {warningsCount > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                      Предупреждения
                    </p>
                    <div className="mt-2 space-y-2">
                      {result.warnings.map((warning, index) => (
                        <div
                          key={`${warning}-${index}`}
                          className="flex items-start gap-2 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-sm"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.inheritance_chain && result.inheritance_chain.length > 1 ? (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        Цепочка наследования
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {result.inheritance_chain.map((id, index) => (
                          <React.Fragment key={`${id}-${index}`}>
                            <Badge
                              variant={
                                index === result.inheritance_chain.length - 1
                                  ? "default"
                                  : "outline"
                              }
                              className="rounded-full"
                            >
                              {id}
                            </Badge>
                            {index < result.inheritance_chain.length - 1 ? (
                              <span className="text-muted-foreground">→</span>
                            ) : null}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

ProfileValidation.propTypes = {
  profileId: PropTypes.string.isRequired,
  profileName: PropTypes.string,
};

ProfileValidation.defaultProps = {
  profileName: "",
};
