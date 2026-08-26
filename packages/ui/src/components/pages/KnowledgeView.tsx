/**
 * Knowledge — the canonical `/character/documents` route: the multimedia hub
 * (#13594). A thin host that mounts the standalone {@link DocumentsView} (which
 * owns its own "Knowledge" header, media-format facets, and pushed reader)
 * inside the shell's agent surface, outside the character-editor chrome.
 */

import { PagePanel } from "../composites/page-panel";
import { ShellViewAgentSurface } from "../views/ShellViewAgentSurface";
import { DocumentsView } from "./DocumentsView";

export function KnowledgeView() {
  return (
    <ShellViewAgentSurface viewId="documents">
      <div className="settings-surface settings-canvas flex h-full min-h-0 w-full flex-col overflow-hidden">
        <PagePanel.ContentRail
          width="compact"
          className="flex min-h-0 flex-1 flex-col pb-[var(--view-pad-bottom)]"
        >
          <DocumentsView standalone fileInputId="knowledge-hub-upload" />
        </PagePanel.ContentRail>
      </div>
    </ShellViewAgentSurface>
  );
}
