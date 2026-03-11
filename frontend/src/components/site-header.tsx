import { useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function SiteHeader() {
  const location = useLocation();

  const titleMap = {
    "/": "Новая проверка",
    "/dashboard": "Обзор",
    "/history": "История проверок",
    "/reports": "Отчёты",
    "/report": "Результат проверки",
    "/profiles": "Профили оформления",
    "/preview": "Предпросмотр",
    "/account": "Аккаунт",
    "/settings": "Настройки",
    "/admin": "Администрирование",
  };

  const currentTitle = titleMap[location.pathname] || "CURSA";

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-base font-medium">{currentTitle}</h1>
        </div>
      </div>
    </header>
  );
}
