// src/components/icons.tsx
"use client";

import type { HTMLAttributes } from 'react';
import type { SVGProps } from "react";
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function RenderriLogo(props: HTMLAttributes<HTMLImageElement>) {
  const { theme, resolvedTheme } = useTheme();
  const [logoSrc, setLogoSrc] = useState("https://qovhpsmldsalfnlcalnv.supabase.co/storage/v1/object/public/main//white-mode.png"); // Default to one logo to avoid flash

  useEffect(() => {
    // resolvedTheme is used to handle the 'system' theme preference
    const currentTheme = resolvedTheme || theme;
    if (currentTheme === 'dark') {
      setLogoSrc("https://qovhpsmldsalfnlcalnv.supabase.co/storage/v1/object/public/main//dark-mode.png");
    } else {
      setLogoSrc("https://qovhpsmldsalfnlcalnv.supabase.co/storage/v1/object/public/main//white-mode.png");
    }
  }, [theme, resolvedTheme]);


  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt="Renderri Logo"
      {...props}
    />
  );
}


export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    );
}
