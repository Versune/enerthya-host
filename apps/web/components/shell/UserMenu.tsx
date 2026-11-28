"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@enerthya/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const initials = (name.trim() || email).slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="user-menu__trigger" aria-label="Account menu">
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="menu" align="end" sideOffset={8}>
        <DropdownMenuLabel className="menu__identity">
          <span className="menu__name">{name}</span>
          <span className="menu__email">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="menu__rule" />
        <DropdownMenuItem
          className="menu__item"
          onSelect={async () => {
            await authClient.signOut();
            window.location.assign("/sign-in");
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
