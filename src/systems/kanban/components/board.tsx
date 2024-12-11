'use client';

import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import { Task as TaskType } from '@/systems/kanban/types';
import {
  Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import {
  ElementDragPayload,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/types';
import { useCallback, useEffect } from 'react';
import invariant from 'tiny-invariant';

import { List } from './list';

export const Board = () => {
  const { present } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  const lists = present;

  const handleDrop = useCallback(
    ({
      source,
      location,
    }: {
      source: ElementDragPayload;
      location: DragLocationHistory;
    }) => {
      const findListById = (listId: number) => {
        const list = lists.find((list) => list.id === listId);
        invariant(list, `List with id ${listId} must exist`);
        return list;
      };

      const findTaskIndex = (tasks: TaskType[], taskId: number) => {
        const index = tasks.findIndex((task) => task.id === taskId);
        invariant(index !== -1, `Task with id ${taskId} must exist`);
        return index;
      };

      const { dropTargets } = location.current;

      // Early exit if no drop targets
      if (!dropTargets.length) return;

      if (source.data.type === 'list') {
        const sourceListId = source.data.listId;
        invariant(typeof sourceListId === 'number');
        const sourceIndex = lists.findIndex((list) => list.id === sourceListId);
        const target = location.current.dropTargets[0];
        const indexOfTarget: number = lists.findIndex(
          (list) => list.id === target.data.listId,
        );
        const closestEdgeOfTarget: Edge | null = extractClosestEdge(
          target.data,
        );

        const toIndex = getReorderDestinationIndex({
          startIndex: sourceIndex,
          indexOfTarget,
          closestEdgeOfTarget,
          axis: 'horizontal',
        });

        dispatch({
          type: 'list/moved',
          fromIndex: sourceIndex,
          toIndex: toIndex,
        });
      }

      if (source.data.type === 'task') {
        const { taskId } = source.data;
        invariant(typeof taskId === 'number');

        // Get source list
        const [, sourceListRecord] = location.initial.dropTargets;
        const sourceListId = sourceListRecord.data.listId;
        invariant(typeof sourceListId === 'number');
        const sourceList = findListById(sourceListId);
        const sourceIndex = findTaskIndex(sourceList.uncompletedTasks, taskId);

        // Drop logic for 1 drop target (dropping onto a list)
        if (dropTargets.length === 1) {
          // Get destination list
          const [destinationListRecord] = dropTargets;
          const destinationListId = destinationListRecord.data.listId;
          invariant(typeof destinationListId === 'number');
          const destinationList = findListById(destinationListId);

          let toIndex: number;

          if (sourceListId === destinationListId) {
            // Reordering within same list
            toIndex = getReorderDestinationIndex({
              startIndex: sourceIndex,
              indexOfTarget: sourceList.uncompletedTasks.length - 1,
              closestEdgeOfTarget: null,
              axis: 'vertical',
            });
          } else {
            // Reordering across lists
            toIndex = destinationList.uncompletedTasks.length;
          }

          dispatch({
            type: 'task/moved',
            fromListId: Number(sourceListId),
            fromIndex: sourceIndex,
            toListId: Number(destinationListId),
            toIndex: toIndex,
          });
        }

        // Drop logic for 2 drop targets (dropping onto a task)
        if (dropTargets.length === 2) {
          // Get destination list and task
          const [destinationTaskRecord, destinationListRecord] = dropTargets;
          const destinationTaskId = destinationTaskRecord.data.taskId;
          const destinationListId = destinationListRecord.data.listId;
          invariant(typeof destinationTaskId === 'number');
          invariant(typeof destinationListId === 'number');
          const destinationList = findListById(destinationListId);
          const destinationIndex = findTaskIndex(
            destinationList.uncompletedTasks,
            destinationTaskId,
          );

          const closestEdgeOfTarget = extractClosestEdge(
            destinationTaskRecord.data,
          );

          let toIndex: number;

          if (sourceListId === destinationListId) {
            // Reordering within same list
            toIndex = getReorderDestinationIndex({
              startIndex: sourceIndex,
              indexOfTarget: destinationIndex,
              closestEdgeOfTarget,
              axis: 'vertical',
            });
          } else {
            // Reordering across lists
            toIndex =
              closestEdgeOfTarget === 'bottom'
                ? destinationIndex + 1
                : destinationIndex;
          }

          dispatch({
            type: 'task/moved',
            fromListId: Number(sourceListId),
            fromIndex: sourceIndex,
            toListId: Number(destinationListId),
            toIndex: toIndex,
          });
        }
      }
    },
    [lists, dispatch],
  );

  useEffect(() => {
    return monitorForElements({
      onDrop: handleDrop,
    });
  }, [handleDrop]);

  return (
    <div className="flex h-full items-start pl-0.5">
      {lists.map((list, listIndex) => (
        <List
          key={list.id}
          list={list}
          listIndex={listIndex}
          boardLength={lists.length}
        />
      ))}
    </div>
  );
};
