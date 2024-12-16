'use client';

import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import {
  ElementDragPayload,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { ListData as ListDataType, TaskData as TaskDataType } from '../types';
import { List } from './list';
import { Portal } from './portal';

export const Board = () => {
  const scrollableRef = useRef<HTMLDivElement | null>(null);

  const [editingListId, setEditingListId] = useState<string | null>(null);

  const { present: lists } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  const handleListDrop = useCallback(
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
      const { listIndex: sourceListIndex } = source.data as ListDataType;

      // Get destination list
      const [destinationListRecord] = dropTargets;
      const { listIndex: destinationListIndex } =
        destinationListRecord.data as ListDataType;

      const closestEdgeOfTarget = extractClosestEdge(
        destinationListRecord.data,
      );

      const endIndex = getReorderDestinationIndex({
        startIndex: sourceListIndex,
        indexOfTarget: destinationListIndex,
        closestEdgeOfTarget,
        axis: 'horizontal',
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

  const handleTaskDrop = useCallback(
    ({
      source,
      location,
    }: {
      source: ElementDragPayload;
      location: DragLocationHistory;
    }) => {
      const { dropTargets } = location.current;
      if (!dropTargets.length) return; // Early exit if no drop targets

      // Get source list and task
      const {
        taskId: sourceTaskId,
        taskPreviousId: sourceTaskPreviousId,
        taskNextId: sourceTaskNextId,
        listId: sourceListId,
      } = source.data as TaskDataType;

      // Drop logic for 1 drop target (dropping task onto a list)
      if (dropTargets.length === 1) {
        // Get destination list
        const [destinationListRecord] = dropTargets;
        const { listId: destinationListId } =
          destinationListRecord.data as ListDataType;

        // Early exit if dropping task onto same list when already at top
        if (destinationListId === sourceListId && sourceTaskPreviousId === null)
          return;

        dispatch({
          type: 'task/moved',
          listId: sourceListId,
          taskId: sourceTaskId,
          destinationListId,
        });
      }

      // Drop logic for 2 drop targets (dropping task onto a task)
      if (dropTargets.length === 2) {
        // Get destination task
        const [destinationTaskRecord] = dropTargets;
        const {
          taskId: destinationTaskId,
          listId: destinationListId,
          taskAncestorIds: destinationTaskAncestorIds,
          taskParentId: destinationTaskParentId,
          taskPreviousId: destinationTaskPreviousId,
        } = destinationTaskRecord.data as TaskDataType;

        const instruction = extractInstruction(destinationTaskRecord.data);

        // Early exit if dropping task onto itself
        switch (destinationTaskId) {
          case sourceTaskId:
            return;
          case sourceTaskNextId && instruction?.type === 'reorder-above':
            return;
          case sourceTaskPreviousId && instruction?.type === 'reorder-below':
            return;
        }

        // Early exit if dropping onto a task that is a child of the source task
        if (destinationTaskAncestorIds.includes(sourceTaskId)) return;

        switch (instruction?.type) {
          case 'make-child':
            dispatch({
              type: 'task/moved',
              listId: sourceListId,
              taskId: sourceTaskId,
              parentId: destinationTaskId,
              destinationListId,
            });
            break;
          case 'reorder-above': {
            dispatch({
              type: 'task/moved',
              listId: sourceListId,
              taskId: sourceTaskId,
              parentId: destinationTaskParentId ?? undefined,
              previousId: destinationTaskPreviousId ?? undefined,
              destinationListId,
            });
            break;
          }
          case 'reorder-below':
            dispatch({
              type: 'task/moved',
              listId: sourceListId,
              taskId: sourceTaskId,
              parentId: destinationTaskParentId ?? undefined,
              previousId: destinationTaskId,
              destinationListId,
            });
            break;
        }
      }
    },
    [dispatch],
  );

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.type === 'list',
        onDrop: handleListDrop,
      }),
    [handleListDrop],
  );

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.type === 'task',
        onDrop: handleTaskDrop,
      }),
    [handleTaskDrop],
  );

  useEffect(() => {
    invariant(scrollableRef.current);

    return autoScrollForElements({
      element: scrollableRef.current,
      canScroll: ({ source }) => source.data.type === 'list',
      getAllowedAxis: () => 'horizontal',
    });
  }, []);

  return (
    <>
      <Portal elementId="desktop-portal" setEditingListId={setEditingListId} />
      <Portal elementId="mobile-portal" setEditingListId={setEditingListId} />
      <div
        ref={scrollableRef}
        data-testid="board"
        className="flex h-full items-start pl-0.5"
        style={{ overflowX: 'scroll' }}
      >
        {lists.map((list, listIndex) => (
          <List
            key={list.id}
            list={list}
            listIndex={listIndex}
            boardLength={lists.length}
            editingListId={editingListId}
            setEditingListId={setEditingListId}
          />
        ))}
      </div>
    </>
  );
};
