import { Fraunces } from "next/font/google";
import { auth } from "@/auth";
import { ChevronRightIcon } from "@/components/icons";
import { PixelSwarm } from "@/components/PixelSwarm";
import styles from "./home.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export default async function Home() {
  const session = await auth();

  return (
    <div className={`${styles.page} ${fraunces.variable}`}>
      <PixelSwarm />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.kicker}>Portfolio Platform</div>
      <main className={styles.hero}>
        <h1 className={styles.headline}>
          Not everyone <em>gets in.</em>
        </h1>
        <p className={styles.subhead}>A private platform for portfolios — held to an invitation, not an open door.</p>
        <div className={styles.links}>
          {session?.member ? (
            <>
              <span className={styles.status}>Signed in — {session.member.status.toLowerCase()}</span>
              <a href={session.member.isOwner ? "/admin" : "/dashboard"} className={styles.link}>
                Enter your dashboard <ChevronRightIcon size={14} />
              </a>
            </>
          ) : (
            <a href="/login" className={styles.link}>
              Request access <ChevronRightIcon size={14} />
            </a>
          )}
          <a href="/directory" className={styles.linkSecondary}>
            Browse the directory <ChevronRightIcon size={14} />
          </a>
        </div>
      </main>
    </div>
  );
}
