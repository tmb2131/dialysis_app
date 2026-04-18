"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNote, updateNote } from "@/lib/actions/notes";
import { todayLocalISO } from "@/lib/utils";
import type { ClinicalNote } from "@/lib/types";

type Props =
  | {
      mode: "create";
      patientId: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      note?: undefined;
    }
  | {
      mode: "edit";
      patientId: string;
      note: ClinicalNote;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

export function NoteForm(props: Props) {
  const { patientId, open, onOpenChange } = props;
  const isEdit = props.mode === "edit";
  const note = isEdit ? props.note : undefined;
  const router = useRouter();

  const [noteDate, setNoteDate] = React.useState(
    note?.note_date ?? todayLocalISO(),
  );
  const [content, setContent] = React.useState(note?.content ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setNoteDate(note?.note_date ?? todayLocalISO());
      setContent(note?.content ?? "");
    }
  }, [open, note]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDate) {
      toast.error("Date is required.");
      return;
    }
    if (noteDate > todayLocalISO()) {
      toast.error("Note date cannot be in the future.");
      return;
    }
    if (!content.trim()) {
      toast.error("Note content is required.");
      return;
    }

    const payload = {
      patient_id: patientId,
      note_date: noteDate,
      content: content.trim(),
    };

    setSubmitting(true);
    const result = isEdit
      ? await updateNote({ ...payload, id: note!.id })
      : await createNote(payload);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Note updated" : "Note added");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "Add note"}</DialogTitle>
          {!isEdit && (
            <DialogDescription>
              Record an event that may affect lab results or medications.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note_date">Date</Label>
            <Input
              id="note_date"
              type="date"
              max={todayLocalISO()}
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note</Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='e.g. "Patient had the flu — missed two dialysis sessions"'
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
