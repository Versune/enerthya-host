import { SignOutButton } from "@/components/SignOutButton";
import { PaletteTrigger } from "@/components/shell/PaletteTrigger";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Topbar({ organization }: { organization: string }) {
  return (
    <header className="topbar">
      <span className="topbar__org">{organization}</span>
      <div className="topbar__tools">
        <PaletteTrigger />
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
