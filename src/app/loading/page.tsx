// Redirect /loading to /loading-screen
import { redirect } from "next/navigation";

export default function LoadingRedirect() {
  redirect("/loading-screen");
}
