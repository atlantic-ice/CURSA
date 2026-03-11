import { ArrowLeft, FileCheck2, MoonStar, ShieldCheck, Sparkles, SunMedium } from "lucide-react";
import { ReactNode, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ColorModeContext } from "../../App";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  highlights: string[];
  children: ReactNode;
}

interface ColorModeContextType {
  toggleColorMode: () => void;
}

const iconMap = [Sparkles, FileCheck2, ShieldCheck] as const;

export function AuthShell({
  badge,
  title,
  description,
  asideTitle,
  asideDescription,
  highlights,
  children,
}: AuthShellProps) {
  const navigate = useNavigate();
  const colorMode = useContext(ColorModeContext) as ColorModeContextType;
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,120,120,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(120,120,120,0.08),transparent_28%)]" />

      <div className="absolute left-4 top-4 z-20 md:left-6 md:top-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={colorMode.toggleColorMode}
        >
          {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
        </Button>
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="relative hidden overflow-hidden border-border/70 bg-card/95 shadow-surface lg:block">
            <CardContent className="flex h-full min-h-[680px] flex-col justify-between p-8 xl:p-10">
              <div className="space-y-6">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                >
                  {badge}
                </Badge>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    CURSA
                  </p>
                  <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-foreground xl:text-5xl">
                    {asideTitle}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground xl:text-base">
                    {asideDescription}
                  </p>
                </div>

                <div className="grid gap-3">
                  {highlights.map((highlight, index) => {
                    const Icon = iconMap[index % iconMap.length];

                    return (
                      <div
                        key={highlight}
                        className="flex items-start gap-4 rounded-3xl border border-border/70 bg-background/70 px-4 py-4"
                      >
                        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card text-muted-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{highlight}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Рабочий контур CURSA с единым визуальным языком, историей проверок и
                            профилями оформления.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/70 bg-background/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Рабочая среда
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-foreground">
                      Нормоконтроль без визуального шума
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Открыть обзор
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-xl overflow-hidden rounded-[32px] border-border/70 bg-card/96 shadow-surface">
              <CardContent className="p-6 md:p-8 lg:p-10">
                <div className="mb-8 space-y-3 text-center lg:text-left">
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                  >
                    {badge}
                  </Badge>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-4xl">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
                      {description}
                    </p>
                  </div>
                </div>

                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
