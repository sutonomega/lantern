import { AppMenu } from "@/app/app-menu";
import { AuthPanel } from "@/app/auth-panel";
import { SearchPanel } from "@/app/search-panel";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
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

      <section className="pageIntro" aria-labelledby="search-page-title">
        <h1 id="search-page-title">検索</h1>
        <p>気になる言葉が入ったランタンを探します。</p>
      </section>

      <SearchPanel isAuthenticated={isAuthenticated} />
    </main>
  );
}
