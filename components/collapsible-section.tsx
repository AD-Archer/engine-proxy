"use client";

import { useState } from "react";

type CollapsibleSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export const CollapsibleSection = ({
  title,
  description,
  children,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-2xl font-semibold text-slate-900 hover:text-slate-700"
        >
          <span>{title}</span>
          <svg
            className={`h-5 w-5 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <p className="text-slate-600">{description}</p>
      </div>
      {isOpen && <div>{children}</div>}
    </section>
  );
};
