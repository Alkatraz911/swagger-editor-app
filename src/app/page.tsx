import { SpecEditor } from "@/components/editor/spec-editor";
import { SplitView } from "@/components/split-view";
import { SpecViewer } from "@/components/viewer/spec-viewer";
import { getUser } from "@/lib/auth/get-user";
import { getSavedSchema } from "@/lib/schemas/get-saved-schema";

export default async function HomePage() {
  const user = await getUser();
  const savedSchema = user ? await getSavedSchema(user.id) : null;
  return (
    <div className="flex flex-1 flex-col">
      <SplitView
        start={
          <SpecEditor userId={user?.id ?? null} savedSchema={savedSchema} />
        }
        end={<SpecViewer />}
      />
    </div>
  );
}
