import { useAuth } from "@/contexts/AuthContext";
import { ToolboxUserView } from "@/features/toolbox/ToolboxUserView";

export default function Toolbox() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="min-w-0 w-full overflow-x-hidden">
      <ToolboxUserView userId={user.id} enableDeepLinkOpen />
    </div>
  );
}
