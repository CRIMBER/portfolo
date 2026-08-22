import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.member) {
    redirect(session.member.isOwner ? "/admin" : "/dashboard");
  }

  return (
    <main className="narrow">
      <div className="panel">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 className="gradientText">Sign in</h1>
          <p>Access your portfolio dashboard.</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
            Sign in with Google
          </button>
        </form>

        {process.env.NODE_ENV !== "production" && (
          <>
            <hr />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="badge" data-tone="warning" style={{ alignSelf: "flex-start" }}>
                Dev only
              </span>
              <p>Stands in for Google until real OAuth credentials are set up.</p>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("dev-login", {
                    email: formData.get("email"),
                    redirectTo: "/dashboard",
                  });
                }}
                style={{ flexWrap: "nowrap" }}
              >
                <input name="email" type="email" placeholder="you@example.com" required style={{ flex: 1, minWidth: 0 }} />
                <button type="submit" className="btn-secondary">
                  Continue
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
