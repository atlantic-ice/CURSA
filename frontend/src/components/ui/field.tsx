import * as React from "react";

import { cn } from "../../lib/utils";
import { Label } from "./label";

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-6", className)} {...props} />
  ),
);
FieldGroup.displayName = "FieldGroup";

type FieldProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "vertical" | "horizontal";
};

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        orientation === "horizontal" ? "flex items-center gap-2" : "grid gap-2",
        className,
      )}
      {...props}
    />
  ),
);
Field.displayName = "Field";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label ref={ref} className={cn("text-sm font-medium", className)} {...props} />
));
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-center text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline",
      className,
    )}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

const FieldSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative text-center text-sm", className)} {...props}>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      <span className="relative bg-background px-2 text-muted-foreground">{children}</span>
    </div>
  ),
);
FieldSeparator.displayName = "FieldSeparator";

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator };
