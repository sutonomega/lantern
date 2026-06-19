import { AppMenu } from "@/app/app-menu";
import { NotificationsContent } from "@/app/notifications-content";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  return (
    <main className="appShell">
      <header className="topBar" aria-label="Lantern">
        <div className="brand">
          <span className="brandLantern" aria-hidden="true" />
          <span>Lantern</span>
        </div>
        <div className="actions" aria-label="主要操作">
          <AppMenu />
        </div>
      </header>

      <NotificationsContent initialUser={user ? { username: user.username } : null} />
    </main>
  );
}
