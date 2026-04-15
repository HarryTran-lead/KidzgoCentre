"use client";

import ManagementMediaWorkspace from "@/components/portal/media/ManagementMediaWorkspace";
import TeacherMediaWorkspace from "@/components/portal/media/TeacherMediaWorkspace";

type WorkspaceMode = "management" | "teacher";

export default function MediaWorkspace({ mode }: { mode: WorkspaceMode }) {
  if (mode === "teacher") {
    return <TeacherMediaWorkspace />;
  }

  return <ManagementMediaWorkspace />;
}
