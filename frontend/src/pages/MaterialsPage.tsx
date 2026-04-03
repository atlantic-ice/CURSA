import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Download,
    FileStack,
    Sparkles,
} from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface MaterialsPageProps {
  className?: string;
}

interface LibraryStat {
  label: string;
  value: string;
  note: string;
}

interface MaterialItem {
  title: string;
  type: string;
  format: string;
  description: string;
  route: string;
  badge: string;
}

const libraryStats: LibraryStat[] = [
  {
    label: "Популярность библиотеки",
    value: "92%",
    note: "Материалы из подборки используют при первой проверке и финальной сдаче.",
  },
  {
    label: "Готовые сценарии",
    value: "18",
    note: "Шаблоны и чек-листы покрывают титул, содержание, главы, таблицы и приложения.",
  },
  {
    label: "Время на старт",
    value: "< 15 мин",
    note: "Достаточно выбрать профиль, шаблон и пройти по контрольному списку.",
  },
];

const materialItems: MaterialItem[] = [
  {
    title: "Шаблон курсовой по ГОСТ 7.32-2017",
    type: "Шаблон",
    format: "DOCX",
    description:
      "Базовая структура документа с уже настроенными стилями, полями, нумерацией и заголовками.",
    route: "/guidelines",
    badge: "Базовый старт",
  },
  {
    title: "Чек-лист предзащиты",
    type: "Чек-лист",
    format: "PDF",
    description:
      "Короткий контрольный список для финальной самопроверки структуры, таблиц, рисунков и библиографии.",
    route: "/examples",
    badge: "Перед сдачей",
  },
  {
    title: "Методичка по оформлению таблиц и рисунков",
    type: "Методичка",
    format: "HTML",
    description:
      "Собранные правила подписи, нумерации и размещения иллюстративных материалов в одном месте.",
    route: "/resources",
    badge: "Частые ошибки",
  },
  {
    title: "Пакет настройки профиля кафедры",
    type: "Инструмент",
    format: "WEB",
    description:
      "Подсказки по выбору профиля в CURSA и быстрой адаптации требований под конкретную кафедру.",
    route: "/profiles",
    badge: "Для кастомизации",
  },
];

const MaterialsPage: FC<MaterialsPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();

  return (
    <AppPageLayout className={className} title="Материалы" maxWidth="wide">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card
          className="overflow-hidden rounded-[32px] border-border/70 text-card-foreground shadow-surface"
          style={{
            background:
              "radial-gradient(circle at top left, var(--status-success-soft), transparent 48%), linear-gradient(135deg, oklch(var(--card)), color-mix(in srgb, oklch(var(--card)) 84%, oklch(var(--muted)) 16%) 55%, oklch(var(--muted)))",
          }}
        >
          <CardHeader className="space-y-4 p-8">
            <Badge className="w-fit border-border/80 bg-background/70 text-foreground hover:bg-background/70">
              Материалы CURSA
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                Библиотека шаблонов, чек-листов и методических материалов
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Собрал единый набор для быстрого старта, самостоятельной проверки и финального
                контроля курсовой работы без ручного поиска по кафедральным документам.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 px-8 pb-8 pt-0">
            <Button
              size="lg"
              className="rounded-2xl"
              onClick={() => navigate("/")}
            >
              <Download className="size-4" />
              Открыть проверку
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-border/80 bg-background/40 text-foreground hover:bg-background/70 hover:text-foreground"
              onClick={() => navigate("/guidelines")}
            >
              <BookOpen className="size-4" />
              Смотреть требования
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {libraryStats.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-[28px] border-border/70 bg-card/70 backdrop-blur"
            >
              <CardHeader className="space-y-2 p-6">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-4xl font-semibold tracking-[-0.05em] text-foreground">
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-sm leading-6 text-muted-foreground">
                {stat.note}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card className="rounded-[32px] border-border/70 bg-card/80">
          <CardHeader className="space-y-3 p-8 pb-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileStack className="size-5" />
              <span className="text-sm font-medium">Подборка материалов</span>
            </div>
            <CardTitle className="text-2xl tracking-[-0.03em] text-foreground md:text-3xl">
              Набор для старта, редактуры и финального контроля
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Каждый материал привязан к конкретному этапу: старт шаблона, проверка примеров, ручная
              вычитка и настройка профильных требований.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-8 pt-2">
            {materialItems.map((item) => (
              <Card
                key={item.title}
                className="rounded-[26px] border-border/70 bg-background/70 transition-colors hover:border-foreground/20"
              >
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/80 bg-background/80"
                      >
                        {item.type}
                      </Badge>
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-300">
                        {item.badge}
                      </Badge>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {item.format}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                        {item.title}
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => navigate(item.route)}
                  >
                    Открыть
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card
          className="rounded-[32px] border-border/70"
          style={{
            background:
              "linear-gradient(180deg, var(--status-warning-soft), color-mix(in srgb, oklch(var(--background)) 96%, transparent))",
          }}
        >
          <CardHeader className="space-y-3 p-8 pb-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-300">
              <Sparkles className="size-5" />
              <span className="text-sm font-medium">Рекомендация</span>
            </div>
            <CardTitle className="text-2xl tracking-[-0.03em]">
              Как использовать библиотеку
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-8 pt-0 text-sm leading-6 text-muted-foreground">
            <div className="flex gap-3 rounded-[24px] border border-border/70 bg-background/70 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <p>
                Начните с шаблона, затем сверяйтесь с примерами и завершайте проверкой чек-листа.
              </p>
            </div>
            <div className="flex gap-3 rounded-[24px] border border-border/70 bg-background/70 p-4">
              <Clock3 className="mt-0.5 size-5 shrink-0 text-sky-500" />
              <p>
                На базовую настройку оформления уходит меньше 15 минут, если сразу выбрать профиль.
              </p>
            </div>
            <Button className="mt-2 w-full rounded-2xl" onClick={() => navigate("/profiles")}>
              Перейти к профилям
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppPageLayout>
  );
};

export default MaterialsPage;
