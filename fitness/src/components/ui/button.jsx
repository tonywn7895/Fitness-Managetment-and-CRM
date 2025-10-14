import * as React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition",
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
