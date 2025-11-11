import { ButtonHTMLAttributes } from "react";
import React from "react";
import { clsx } from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};

export function Button({ className, variant = "primary", size = "md", asChild, children, ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand text-on-brand hover:bg-brand-dark",
    secondary: "bg-surface text-foreground border border-brand hover:bg-brand-soft",
    ghost: "bg-transparent text-foreground hover:bg-brand-soft"
  }[variant];
  const sizes = { sm: "px-2.5 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-3 text-lg" }[size];
  const classes = clsx(base, variants, sizes, className);
  
  if (asChild && children) {
    const child = children as React.ReactElement;
    return React.cloneElement(child, { className: clsx(classes, child.props.className) });
  }
  
  return <button className={classes} {...props}>{children}</button>;
}

