/** @format */

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Button, Text } from "@radix-ui/themes";
import PowerdByBranding from "./PowerdByBranding";

const navLinks = [
  { href: "/", label: "Chat" },
  { href: "/articles", label: "Articles" },
  { href: "/vector-search", label: "Search" },
  { href: "/image-block-service", label: "Image Block Service" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full px-8 py-2 flex items-center gap-4 border-b border-gray-200">
      <Text as="span" size="5" weight="bold" color="blue">
        Bauer AI
      </Text>
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
      <div className="grow" />
      <PowerdByBranding />
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </nav>
  );
}
