import { PaletteTrigger } from "@/components/shell/PaletteTrigger";
import { UserMenu } from "@/components/shell/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Topbar({
  organization,
  user,
}: {
  organization: string;
  user: { name: string; email: string };
}) {
  return (
    <header className="topbar">
      <span className="topbar__org">{organization}</span>
      <div className="topbar__tools">
        <PaletteTrigger />
        <ThemeToggle />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
