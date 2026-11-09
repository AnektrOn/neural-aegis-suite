import { useAuth } from "@/contexts/AuthContext";
import { ToolboxUserView } from "@/features/toolbox/ToolboxUserView";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";

export default function Toolbox() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <ToolboxUserView userId={user.id} enableDeepLinkOpen />
    </MemberPageScaffold>
  );
}
