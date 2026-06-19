import { AppMenu } from "@/app/app-menu";
import { AuthPanel } from "@/app/auth-panel";
import { NotificationPanel } from "@/app/notification-panel";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);

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

      <AuthPanel initialUser={user ? { username: user.username } : null} />

      <section className="pageIntro" aria-labelledby="notifications-page-title">
        <h1 id="notifications-page-title">届いた灯り</h1>
        <p>あなたのランタンに灯りがついた時だけ、ここに届きます。</p>

        {isAuthenticated ? (
          <NotificationPanel isAuthenticated={isAuthenticated} />
        ) : (
          <div className="emptyState">
            <p>届いた灯りを確認するにはログインしてください。</p>
          </div>
        )}
      </section>
    </main>
  );
}
