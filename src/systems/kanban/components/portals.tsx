import { NavbarItem } from '@/components/catalyst/navbar';
import {
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
} from '@/components/catalyst/sidebar';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  ElementDragPayload,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/types';
import {
  ArrowUturnLeftIcon as ArrowUturnLeftIcon20,
  ArrowUturnRightIcon as ArrowUturnRightIcon20,
  ListBulletIcon as ListBulletIcon20,
  PlusIcon as PlusIcon20,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import invariant from 'tiny-invariant';

import {
  List as ListType,
  SidebarListItemData as SidebarListItemDataType,
} from '../types';

type DragState = { type: 'idle' } | { type: 'is-dragging' };

type DropState =
  | { type: 'idle' }
  | { type: 'is-sidebar-list-item-over'; closestEdge: Edge | null };

const SidebarListItem = ({
  list,
  listIndex,
  activeListId,
  setActiveListId,
}: {
  list: ListType;
  listIndex: number;
  activeListId: string | null;
  setActiveListId: (listId: string | null) => void;
}) => {
  const listId = list.id;

  const listItemRef = useRef<HTMLButtonElement | null>(null);

  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [dropState, setDropState] = useState<DropState>({ type: 'idle' });

  // Set up draggable and drop target for list
  useEffect(() => {
    invariant(listItemRef.current);

    const data: SidebarListItemDataType = {
      type: 'sidebar-list-item',
      listId,
      listIndex,
    };

    return combine(
      draggable({
        element: listItemRef.current,
        getInitialData: () => data,
        onDragStart: () => setDragState({ type: 'is-dragging' }),
        onDrop: () => {
          setDragState({ type: 'idle' });
          setDropState({ type: 'idle' });
        },
      }),
      dropTargetForElements({
        element: listItemRef.current,
        getData: ({ input, element }) => {
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          });
        },
        canDrop: ({ source }) => source.data.type === 'sidebar-list-item',
        getIsSticky: () => true,
        onDragEnter: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-sidebar-list-item-over', closestEdge });
        },
        onDrag: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-sidebar-list-item-over', closestEdge });
        },
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
    );
  }, [listId, listIndex]);

  return (
    <SidebarItem
      ref={listItemRef}
      data-testid={`sidebar-list-item-${listId}`}
      current={listId === activeListId}
      onClick={() => setActiveListId(listId)}
      className={clsx([
        // Basic layout
        '-mt-1',
        // Drop indicator
        'border-b-2 border-t-2 border-transparent',
        dropState.type === 'is-sidebar-list-item-over' &&
          dropState.closestEdge === 'top' &&
          'border-t-blue-500',
        dropState.type === 'is-sidebar-list-item-over' &&
          dropState.closestEdge === 'bottom' &&
          'border-b-blue-500',
      ])}
    >
      <ListBulletIcon20 />
      <SidebarLabel>{list.name}</SidebarLabel>
    </SidebarItem>
  );
};

export function ListsPortal({
  className,
  index,
  activeListId,
  setActiveListId,
  setIsEditingList,
}: {
  className: string;
  index: number;
  activeListId: string | null;
  setActiveListId: (listId: string | null) => void;
  setIsEditingList: (isEditing: boolean) => void;
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
          setIsEditingList(true);
        }, 0); // Avoid bad setState on render
      },
    });
  };

  const handleSidebarListItemDrop = useCallback(
    ({
      source,
      location,
    }: {
      source: ElementDragPayload;
      location: DragLocationHistory;
    }) => {
      const { dropTargets } = location.current;
      if (!dropTargets.length) return; // Early exit if no drop targets

      // Get source list
      const { listIndex: sourceListIndex } =
        source.data as SidebarListItemDataType;

      // Get destination list
      const [destinationListRecord] = dropTargets;
      const { listIndex: destinationListIndex } =
        destinationListRecord.data as SidebarListItemDataType;

      const closestEdgeOfTarget = extractClosestEdge(
        destinationListRecord.data,
      );

      const endIndex = getReorderDestinationIndex({
        startIndex: sourceListIndex,
        indexOfTarget: destinationListIndex,
        closestEdgeOfTarget,
        axis: 'vertical',
      });

      // Early exit if no change in list index
      if (endIndex === sourceListIndex) return;

      dispatch({
        type: 'list/moved',
        startIndex: sourceListIndex,
        endIndex,
      });
    },
    [dispatch],
  );

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

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.type === 'sidebar-list-item',
        onDrop: handleSidebarListItemDrop,
      }),
    [handleSidebarListItemDrop],
  );

  if (!portalNode) return null;

  return createPortal(
    <>
      <SidebarHeading>Lists</SidebarHeading>
      <SidebarItem
        aria-label="Add list"
        data-testid="add-list-button"
        onClick={addList}
      >
        <PlusIcon20 />
        <SidebarLabel>Add a list</SidebarLabel>
      </SidebarItem>
      {lists.map((list, listIndex) => (
        <SidebarListItem
          key={list.id}
          list={list}
          listIndex={listIndex}
          activeListId={activeListId}
          setActiveListId={setActiveListId}
        />
      ))}
    </>,
    portalNode,
  );
}

export function ShortcutsPortal({
  elementId,
  setActiveListId,
  setIsEditingList,
}: {
  elementId: string;
  setActiveListId: (listId: string | null) => void;
  setIsEditingList: (isEditing: boolean) => void;
}) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const dispatch = useKanbanDispatch();
  const { past, future } = useKanbanHistory();

  const addList = () => {
    dispatch({
      type: 'list/inserted',
      onListInserted: (list) => {
        setTimeout(() => {
          setActiveListId(list.id);
          setIsEditingList(true);
        }, 0); // Avoid bad setState on render
      },
    });
  };

  const undo = () => dispatch({ type: 'board/undo' });

  const redo = () => dispatch({ type: 'board/redo' });

  /*
   * Hotkeys
   */

  useHotkeys('ctrl+z', undo, { enableOnFormTags: true, preventDefault: true });

  useHotkeys('ctrl+shift+z', redo, {
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('ctrl+l', addList, {
    enableOnFormTags: true,
    preventDefault: true,
  });

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
