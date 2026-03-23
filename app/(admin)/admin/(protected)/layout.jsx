import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default function ProtectedAdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
