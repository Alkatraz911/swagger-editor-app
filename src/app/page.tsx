import { SpecEditor } from "@/components/editor/spec-editor";
import { SplitView } from "@/components/split-view";
import { SpecViewer } from "@/components/viewer/spec-viewer";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SplitView start={<SpecEditor />} end={<SpecViewer />} />
    </div>
  );
}
