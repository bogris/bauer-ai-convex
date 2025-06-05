/** @format */

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Button, Text } from "@radix-ui/themes";
import PowerdByBranding from "./PowerdByBranding";
import Image from "next/image";
import { useState } from "react";
import { IconButton } from "@radix-ui/themes";
import { useThreadsState } from "./use-threads-state";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
const navLinks = [
  { href: "/", label: "Chat" },
  { href: "/articles", label: "Articles" },
  { href: "/vector-search", label: "Search" },
  { href: "/image-block-service", label: "Service" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { showThreadsPanel, setShowThreadsPanel } = useThreadsState();
  return (
    <nav className="w-full px-4 sm:px-8 py-2 flex items-center gap-4 border-b border-gray-200 relative">
      <IconButton
        variant={showThreadsPanel ? "soft" : "outline"}
        color="blue"
        onClick={() => setShowThreadsPanel(!showThreadsPanel)}
        aria-label={showThreadsPanel ? "Hide threads" : "Show threads"}
      >
        <ChatBubbleIcon />
      </IconButton>
      <Link href="/" className="flex items-center gap-2 z-20">
        <Image
          src="/android-chrome-192x192.png"
          alt="Bauer Assist"
          width={32}
          height={32}
        />
        <Text as="span" size="4" color="sky">
          Bauer Assist
        </Text>
      </Link>
      {/* Hamburger menu for mobile */}
      <button
        className="sm:hidden ml-auto z-20"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Open navigation menu"
      >
        <svg
          width="28"
          height="28"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {/* Chat bubble toggle for threads - only on mobile */}

      {/* Nav links - hidden on mobile, flex on sm+ */}
      <div className="hidden sm:flex items-center gap-2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant={pathname === link.href ? "soft" : "outline"}
              color="grass"
            >
              {link.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="grow hidden sm:block" />
      <div className="hidden sm:flex items-center gap-2">
        <PowerdByBranding />
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-start gap-2 px-4 py-4 sm:hidden z-10 border-b border-gray-200 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              <Button
                variant={pathname === link.href ? "soft" : "outline"}
                color="grass"
                className="w-full justify-start"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <div className="flex items-center gap-2 w-full mt-2">
            <PowerdByBranding />
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}
