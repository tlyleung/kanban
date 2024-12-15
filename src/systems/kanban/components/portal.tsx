import { Link } from '@/components/catalyst/link';
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from '@/components/catalyst/navbar';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import {
  ArrowUturnLeftIcon as ArrowUturnLeftIcon20,
  ArrowUturnRightIcon as ArrowUturnRightIcon20,
  PlusIcon as PlusIcon20,
} from '@heroicons/react/20/solid';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Portal({
  setEditingListId,
}: {
  setEditingListId: (listId: string | null) => void;
}) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const dispatch = useKanbanDispatch();
  const { past, future } = useKanbanHistory();

  const addList = () => {
    dispatch({
      type: 'list/inserted',
      onListInserted: (list) => {
        setTimeout(() => setEditingListId(list.id), 0); // Avoid bad setState on render
      },
    });
  };

  const undo = () => dispatch({ type: 'board/undo' });

  const redo = () => dispatch({ type: 'board/redo' });

  useEffect(() => setPortalNode(document.getElementById('portal')), []);

  if (!portalNode) return null;

  return createPortal(
    <Navbar>
      <Link href="/" aria-label="Home">
        Board 1
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem aria-label="Add list" onClick={addList}>
          <PlusIcon20 />
        </NavbarItem>
        <NavbarItem
          aria-label="Undo"
          disabled={past.length === 0}
          onClick={undo}
        >
          <ArrowUturnLeftIcon20 />
        </NavbarItem>
        <NavbarItem
          aria-label="Redo"
          disabled={future.length === 0}
          onClick={redo}
        >
          <ArrowUturnRightIcon20 />
        </NavbarItem>
      </NavbarSection>
    </Navbar>,
    portalNode,
  );
}
