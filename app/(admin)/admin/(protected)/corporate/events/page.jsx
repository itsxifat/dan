import { redirect } from "next/navigation";

export default function CorporateEventsRedirect() {
  redirect("/admin/corporate/manage");
}
