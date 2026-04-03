import {
    ArrowRight,
    BookMarked,
    ExternalLink,
    FolderSearch,
    GraduationCap,
    Scale,
    Search,
} from "lucide-react";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface ResourcesPageProps {
  className?: string;
}

interface ResourceItem {
  title: string;
  category: string;
  description: string;
  actionLabel: string;
  href?: string;
  route?: string;
}

const resourceItems: ResourceItem[] = [
  {
    title: "Актуальные требования по оформлению",
    category: "Нормативная база",
    description:
      "Сводка ключевых правил по полям, шрифтам, заголовкам, таблицам и спискам литературы.",
    actionLabel: "Открыть требования",
    route: "/guidelines",
  },
  {
    title: "Коллекция визуальных примеров",
    category: "Разборы",
    description: "Подборка корректных и проблемных фрагментов оформления для быстрой самопроверки.",
    actionLabel: "Смотреть примеры",
    route: "/examples",
  },
  {
    title: "ГОСТ 7.32-2017",
    category: "Стандарт",
    description:
      "Первичный документ, на который ориентируются базовые профили CURSA при проверке оформления.",
    actionLabel: "Открыть стандарт",
    href: "https://protect.gost.ru",
  },
  {
    title: "Профили и требования кафедр",
    category: "Профили CURSA",
    description:
      "Управление профилями под кафедру, университет или внутренний шаблон вашей команды.",
    actionLabel: "Перейти к профилям",
    route: "/profiles",
  },
];

const ResourcesPage: FC<ResourcesPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const visibleResources = resourceItems.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return `${item.title} ${item.category} ${item.description}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const handleOpen = (item: ResourceItem): void => {
    if (item.route) {
      navigate(item.route);
      return;
    }

    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AppPageLayout className={className} title="Ресурсы" maxWidth="wide">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <Card
          className="rounded-[32px] border-border/70 text-card-foreground shadow-surface"
          style={{
            background:
              "radial-gradient(circle at top right, var(--status-info-soft), transparent 32%), linear-gradient(135deg, oklch(var(--card)), color-mix(in srgb, oklch(var(--card)) 84%, oklch(var(--muted)) 16%) 48%, oklch(var(--muted)))",
          }}
        >
          <CardHeader className="space-y-4 p-8">
            <Badge className="w-fit border-border/80 bg-background/70 text-foreground hover:bg-background/70">
              Навигация по знаниям
            </Badge>
            <CardTitle className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Полезные ресурсы для подготовки и проверки документов
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Здесь собраны нормативные документы, разборы и внутренние инструменты CURSA, которые
              помогают быстро сверить оформление и не потерять важные требования.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-8 pb-8 pt-0 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/70 bg-background/40 p-4">
              <Scale className="mb-3 size-5 text-sky-300" />
              <p className="text-sm font-medium text-foreground">Нормативная база</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Стандарты и требования без долгого ручного поиска.
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/40 p-4">
              <BookMarked className="mb-3 size-5 text-emerald-300" />
              <p className="text-sm font-medium text-foreground">Готовые разборы</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Примеры удачного и проблемного оформления под рукой.
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/40 p-4">
              <GraduationCap className="mb-3 size-5 text-amber-300" />
              <p className="text-sm font-medium text-foreground">Рабочие профили</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Переход от стандарта к конкретным требованиям кафедры.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-border/70 bg-card/80">
          <CardHeader className="space-y-3 p-8 pb-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Search className="size-5" />
              <span className="text-sm font-medium">Быстрый фильтр</span>
            </div>
            <CardTitle className="text-2xl tracking-[-0.03em]">Найти нужный источник</CardTitle>
            <CardDescription>Фильтр по названию, типу ресурса и краткому описанию.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-8 pt-0">
            <label className="block">
              <span className="sr-only">Поиск по ресурсам</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Например: ГОСТ, примеры, профили"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground/30"
              />
            </label>
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
              Отфильтровано:{" "}
              <span className="font-medium text-foreground">{visibleResources.length}</span>{" "}
              ресурса(ов)
            </div>
            <Button className="w-full rounded-2xl" onClick={() => navigate("/materials")}>
              Открыть библиотеку материалов
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-[32px] border-border/70 bg-card/80">
          <CardHeader className="space-y-3 p-8 pb-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <FolderSearch className="size-5" />
              <span className="text-sm font-medium">Каталог ресурсов</span>
            </div>
            <CardTitle className="text-2xl tracking-[-0.03em] md:text-3xl">
              Источники, которые действительно помогают при сдаче
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Собрал маршруты внутри продукта и внешние ориентиры, к которым имеет смысл обращаться
              во время подготовки документа.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-8 pt-2 md:grid-cols-2">
            {visibleResources.map((item) => (
              <Card
                key={item.title}
                className="rounded-[26px] border-border/70 bg-background/70 transition-colors hover:border-foreground/20"
              >
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/80 bg-background/80"
                    >
                      {item.category}
                    </Badge>
                    {item.href ? (
                      <Badge className="rounded-full bg-sky-500/15 text-sky-600 hover:bg-sky-500/15 dark:text-sky-300">
                        Внешний
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-300">
                        Внутри CURSA
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                      {item.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="mt-auto pt-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl"
                      onClick={() => handleOpen(item)}
                    >
                      {item.actionLabel}
                      {item.href ? (
                        <ExternalLink className="size-4" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppPageLayout>
  );
};

export default ResourcesPage;
