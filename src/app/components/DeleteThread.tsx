/** @format */

import { api } from "@/convex/_generated/api";
import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { Dialog } from "@radix-ui/themes";
import { useAction } from "convex/react";

export default function DeleteThreadButton({
  threadId,
  afterDelete,
}: {
  threadId: string;
  afterDelete: () => void;
}) {
  const deleteThread = useAction(api.agentActions.deleteThread);

  const onDelete = async () => {
    await deleteThread({ threadId });
    afterDelete();
  };
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button
          variant="ghost"
          color="red"
          size="1"
          className="ml-2"
          aria-label="Delete thread"
        >
          <TrashIcon />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="350px">
        <Dialog.Title>Delete thread?</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Are you sure you want to delete this thread? This action cannot be
          undone.
        </Dialog.Description>
        <div className="flex gap-3 justify-end mt-4">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button color="red" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
