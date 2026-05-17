"use client";

import ManagementMediaWorkspace from "@/components/portal/media/ManagementMediaWorkspace";
import TeacherMediaWorkspace from "@/components/portal/media/TeacherMediaWorkspace";
import MediaWorkspaceCore from "@/components/portal/media/MediaWorkspaceCore";

type WorkspaceMode = "admin" | "staff" | "teacher";

export default function MediaWorkspace({ mode }: { mode: WorkspaceMode }) {
  if (mode === "teacher") {
    return <TeacherMediaWorkspace />;
  }

  if (mode === "staff") {
    return <MediaWorkspaceCore mode="staff" />;
  }

  return <ManagementMediaWorkspace />;
}
