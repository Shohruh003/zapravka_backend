import "./types/envelope"; // load global Express type augmentation
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env, assertProductionSecrets } from "./config/env";
import { ensureSuperAdmin } from "./bootstrap/ensureSuperAdmin";

async function main(): Promise<void> {
  assertProductionSecrets(); // fail fast on weak secrets in production

  if (env.otp.mode !== "dev") {
    console.warn(
      `⚠️  OTP_MODE="${env.otp.mode}" but no real SMS provider is wired yet — ` +
        `registration codes will NOT be delivered. Implement sendOtp() in src/utils/otp.ts.`
    );
  }

  await connectDB();
  await ensureSuperAdmin();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`🚀 Zapravka backend running at ${env.baseUrl}  (port ${env.port})`);
    console.log(`   OTP mode: ${env.otp.mode}${env.otp.devFixed ? ` (fixed: ${env.otp.devFixed})` : ""}`);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
