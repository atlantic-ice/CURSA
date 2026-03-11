import { CSSProperties, FC, ReactNode } from "react";

import { cn } from "../../lib/utils";

interface AppPageLayoutProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: "wide" | "narrow";
  style?: CSSProperties;
  showTitleBar?: boolean;
}

const AppPageLayout: FC<AppPageLayoutProps> = ({
  title,
  children,
  actions,
  className,
  contentClassName,
  maxWidth = "wide",
  style,
  showTitleBar = false,
}) => {
  const widthClassName = maxWidth === "narrow" ? "max-w-[1320px]" : "max-w-[1480px]";

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)} style={style}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-5 px-4 py-5 md:px-6 md:py-6",
            widthClassName,
            contentClassName,
          )}
        >
          {showTitleBar || actions ? (
            <div
              className={cn(
                "flex flex-wrap gap-3",
                showTitleBar && actions ? "items-center justify-between" : "justify-end",
              )}
            >
              {showTitleBar ? (
                <h1 className="brand-heading truncate text-[14px] font-semibold tracking-[-0.02em] text-foreground">
                  {title}
                </h1>
              ) : null}
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppPageLayout;
