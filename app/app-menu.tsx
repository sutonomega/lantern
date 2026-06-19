"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "新しいランタン" },
  { href: "/search", label: "検索" },
  { href: "/notifications", label: "届いた灯り" }
];

export function AppMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="appMenu">
      <button
        type="button"
        className="menuButton"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isOpen}
        aria-controls="main-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen ? (
        <nav className="menuPanel" id="main-menu" aria-label="メニュー">
          {links.map((link) => (
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setIsOpen(false)}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
