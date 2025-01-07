import { NavbarItem } from '@/components/catalyst/navbar';
import {
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
} from '@/components/catalyst/sidebar';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import {
  ArrowUturnLeftIcon as ArrowUturnLeftIcon20,
  ArrowUturnRightIcon as ArrowUturnRightIcon20,
  ListBulletIcon as ListBulletIcon20,
  PlusIcon as PlusIcon20,
} from '@heroicons/react/20/solid';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ListsPortal({
  className,
  index,
  activeListId,
  setActiveListId,
  setEditingListId,
}: {
  className: string;
  index: number;
  activeListId: string;
  setActiveListId: (listId: string) => void;
  setEditingListId: (listId: string | null) => void;
}) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const dispatch = useKanbanDispatch();
  const { present: lists } = useKanbanHistory();

  const addList = () => {
    dispatch({
      type: 'list/inserted',
      onListInserted: (list) => {
        setTimeout(() => {
          setActiveListId(list.id);
          setEditingListId(list.id);
        }, 0); // Avoid bad setState on render
      },
    });
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const element = document.querySelectorAll(`.${className}`)[index];
      if (element instanceof HTMLElement) {
        setPortalNode(element);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [className, index]);

  if (!portalNode) return null;

  return createPortal(
    <>
      <SidebarHeading>Lists</SidebarHeading>
      <SidebarItem href="#" onClick={addList}>
        <PlusIcon20 />
        <SidebarLabel>Add a list</SidebarLabel>
      </SidebarItem>
      {lists.map((list) => (
        <SidebarItem
          key={list.id}
          href="#"
          current={list.id === activeListId}
          onClick={() => setActiveListId(list.id)}
        >
          <ListBulletIcon20 />
          <SidebarLabel>{list.name}</SidebarLabel>
        </SidebarItem>
      ))}
    </>,
    portalNode,
  );
}

export function ShortcutsPortal({
  elementId,
  setEditingListId,
}: {
  elementId: string;
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

  useEffect(
    () => setPortalNode(document.getElementById(elementId)),
    [elementId],
  );

  if (!portalNode) return null;

  return createPortal(
    <>
      <NavbarItem
        aria-label="Add list"
        data-testid="add-list-button"
        onClick={addList}
      >
        <PlusIcon20 />
      </NavbarItem>
      <NavbarItem aria-label="Undo" disabled={past.length === 0} onClick={undo}>
        <ArrowUturnLeftIcon20 />
      </NavbarItem>
      <NavbarItem
        aria-label="Redo"
        disabled={future.length === 0}
        onClick={redo}
      >
        <ArrowUturnRightIcon20 />
      </NavbarItem>
    </>,
    portalNode,
  );
}
