"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

/** Derive breadcrumb crumbs from the current pathname. */
export function getBreadcrumbCrumbs(pathname: string): BreadcrumbCrumb[] {
  // /dashboard/courses/[id]/lectures/[id]
  const lectureMatch = pathname.match(/^\/dashboard\/courses\/([^/]+)\/lectures\/([^/]+)/);
  if (lectureMatch) {
    return [
      { label: "My Courses", href: "/dashboard/courses" },
      { label: "Course", href: `/dashboard/courses/${lectureMatch[1]}` },
      { label: "Lecture" },
    ];
  }

  // /dashboard/quiz/[id]
  const quizMatch = pathname.match(/^\/dashboard\/quiz\/([^/]+)/);
  if (quizMatch) {
    return [
      { label: "Quizzes", href: "/dashboard/quizzes" },
      { label: "Quiz" },
    ];
  }

  // /dashboard/shared/[id]
  const sharedCourseMatch = pathname.match(/^\/dashboard\/shared\/([^/]+)/);
  if (sharedCourseMatch) {
    return [
      { label: "Shared with Me", href: "/dashboard/shared" },
      { label: "Course" },
    ];
  }

  // /dashboard/courses/[id]
  const courseMatch = pathname.match(/^\/dashboard\/courses\/([^/]+)/);
  if (courseMatch) {
    return [
      { label: "My Courses", href: "/dashboard/courses" },
      { label: "Course" },
    ];
  }

  const staticRoutes: Record<string, BreadcrumbCrumb[]> = {
    "/dashboard": [{ label: "Dashboard" }],
    "/dashboard/courses": [{ label: "Dashboard", href: "/dashboard" }, { label: "My Courses" }],
    "/dashboard/quizzes": [{ label: "Dashboard", href: "/dashboard" }, { label: "Quizzes" }],
    "/dashboard/shared": [{ label: "Dashboard", href: "/dashboard" }, { label: "Shared with Me" }],
    "/dashboard/subscription": [{ label: "Dashboard", href: "/dashboard" }, { label: "Subscription" }],
    "/dashboard/settings": [{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }],
  };

  return staticRoutes[pathname] ?? [{ label: "Dashboard", href: "/dashboard" }];
}

// Pages can override URL-derived crumbs with dynamic ones (e.g. real titles).
type BreadcrumbContextValue = {
  override: BreadcrumbCrumb[] | null;
  setOverride: (crumbs: BreadcrumbCrumb[] | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  override: null,
  setOverride: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<BreadcrumbCrumb[] | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

/** Read-only access to the active override (used by the layout). */
export function useBreadcrumbOverride() {
  return useContext(BreadcrumbContext).override;
}

/**
 * Push dynamic breadcrumb crumbs from a page; they replace the URL-derived
 * crumbs while the component is mounted, then clear on unmount.
 */
export function useSetBreadcrumb(crumbs: BreadcrumbCrumb[] | null) {
  const { setOverride } = useContext(BreadcrumbContext);
  // Stable serialization so deep-equal arrays don't trigger re-runs.
  const key = crumbs ? JSON.stringify(crumbs) : "";
  const apply = useCallback(() => {
    setOverride(crumbs);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    apply();
    return () => setOverride(null);
  }, [apply, setOverride]);
}

// ── Rendered bar (used inside AppHeader) ─────────────────────────────────────

export function DashboardBreadcrumb({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {
  if (!crumbs.length) return null;
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              <BreadcrumbItem className={isLast ? "bg-app-bg rounded-md" : ""}>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="max-w-[200px] truncate text-[13px]">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={crumb.href}
                      className="max-w-[200px] truncate text-[13px] text-gray-500 hover:text-gray-900"
                    >
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
