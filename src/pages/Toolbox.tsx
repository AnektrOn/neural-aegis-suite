import { useAuth } from "@/contexts/AuthContext";
import { ToolboxUserView } from "@/features/toolbox/ToolboxUserView";

export default function Toolbox() {
  const { user } = useAuth();
  if (!user) return null;
  return <ToolboxUserView userId={user.id} enableDeepLinkOpen />;
}
