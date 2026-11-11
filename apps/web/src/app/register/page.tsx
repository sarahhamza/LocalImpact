
import { redirect } from "next/navigation";
import { AuthScreen } from "../../components/auth/auth-screen";
import { getSession } from "../../lib/session";

export default async function RegisterPage() {
  const session = await getSession();

  if (session) {
    redirect("/welcome");
  }

  return <AuthScreen mode="register" />;
}
