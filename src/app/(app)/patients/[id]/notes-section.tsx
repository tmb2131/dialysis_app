"use client";

import * as React from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteForm } from "./note-form";
import { deleteNote } from "@/lib/actions/notes";
import { formatDate } from "@/lib/utils";
import type { ClinicalNote } from "@/lib/types";

export function NotesSection({
  patientId,
  notes,
}: {
  patientId: string;
  notes: ClinicalNote[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClinicalNote | null>(null);

  const sorted = React.useMemo(() => {
    return [...notes].sort((a, b) => {
      const d = b.note_date.localeCompare(a.note_date);
      if (d !== 0) return d;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [notes]);

  async function handleDelete(n: ClinicalNote) {
    if (!confirm(`Delete note from ${formatDate(n.note_date)}? This cannot be undone.`)) {
      return;
    }
    const result = await deleteNote(n.id, patientId);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Note deleted");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Notes</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Note
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {sorted.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                onEdit={() => setEditing(n)}
                onDelete={() => handleDelete(n)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <NoteForm
        mode="create"
        patientId={patientId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      {editing && (
        <NoteForm
          mode="edit"
          patientId={patientId}
          note={editing}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </Card>
  );
}

function NoteRow({
  note,
  onEdit,
  onDelete,
}: {
  note: ClinicalNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">{formatDate(note.note_date)}</div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {note.content}
          </p>
        </div>
      </div>
      <div className="flex gap-1 sm:shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit note">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete note">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
