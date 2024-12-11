import { Checkbox } from '@/components/catalyst/checkbox';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
  DropdownShortcut,
} from '@/components/catalyst/dropdown';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import { Task as TaskType } from '@/systems/kanban/types';
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Input } from '@headlessui/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisHorizontalIcon,
  ListBulletIcon,
  TrashIcon,
} from '@heroicons/react/16/solid';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import invariant from 'tiny-invariant';

type DragState = { type: 'idle' } | { type: 'is-dragging' };

type DropState =
  | { type: 'idle' }
  | { type: 'is-task-over'; closestEdge: Edge | null };

export const Task = ({
  task,
  taskIndex,
  listId,
  listLength,
}: {
  task: TaskType;
  taskIndex: number;
  listId: number;
  listLength: number;
}) => {
  const taskId = task.id;

  const taskRef = useRef<HTMLLIElement>(null);

  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [dropState, setDropState] = useState<DropState>({ type: 'idle' });
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { present } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  const deleteTask = () => dispatch({ type: 'task/deleted', taskId });

  const moveTaskToTop = () => {
    dispatch({
      type: 'task/moved',
      fromListId: listId,
      fromIndex: taskIndex,
      toListId: listId,
      toIndex: 0,
    });
  };

  const moveTaskUp = () => {
    dispatch({
      type: 'task/moved',
      fromListId: listId,
      fromIndex: taskIndex,
      toListId: listId,
      toIndex: taskIndex - 1,
    });
  };

  const moveTaskDown = () => {
    dispatch({
      type: 'task/moved',
      fromListId: listId,
      fromIndex: taskIndex,
      toListId: listId,
      toIndex: taskIndex + 1,
    });
  };

  const moveTaskToBottom = () => {
    dispatch({
      type: 'task/moved',
      fromListId: listId,
      fromIndex: taskIndex,
      toListId: listId,
      toIndex: listLength - 1,
    });
  };

  const moveTaskToList = (toListId: number) => {
    dispatch({
      type: 'task/moved',
      fromListId: listId,
      fromIndex: taskIndex,
      toListId,
      toIndex: 0,
    });
  };

  const renameTask = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'task/renamed', taskId, text: e.target.value });
  };

  const toggleTask = () => dispatch({ type: 'task/toggled', taskId });

  // Set up the draggable and drop target for the task
  useEffect(() => {
    invariant(taskRef.current);

    if (task.done || isEditing) return;

    return combine(
      draggable({
        element: taskRef.current,
        getInitialData: () => ({ type: 'task', taskId }),
        onDragStart: () => setDragState({ type: 'is-dragging' }),
        onDrop: () => setDragState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: taskRef.current,
        canDrop: (args) => args.source.data.type === 'task',
        getData: ({ input, element }) => {
          const data = { type: 'task', taskId };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          });
        },
        getIsSticky: () => true,
        onDragEnter: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-task-over', closestEdge });
        },
        onDrag: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-task-over', closestEdge });
        },
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
    );
  }, [taskId, task.done, isEditing]);

  return (
    <li
      ref={taskRef}
      className={clsx([
        'relative -mt-0.5',
        // Drop indicator
        'border-b-2 border-t-2 border-transparent',
        dropState.type === 'is-task-over' &&
          dropState.closestEdge === 'top' &&
          'border-t-blue-500',
        dropState.type === 'is-task-over' &&
          dropState.closestEdge === 'bottom' &&
          'border-b-blue-500',
      ])}
    >
      <div
        className={clsx([
          // Basic layout
          'flex items-center gap-2 px-[calc(theme(spacing[3.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)]',
          // Hover state
          'hover:bg-zinc-950/5 dark:hover:bg-white/10',
          // Dragging state
          dragState.type === 'is-dragging' && 'opacity-50',
        ])}
      >
        <Checkbox checked={task.done} onChange={toggleTask} />
        {isEditing ? (
          <Input
            autoFocus
            type="text"
            value={task.text}
            placeholder="Task name"
            onChange={renameTask}
            onBlur={() => setIsEditing(false)}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            className={clsx([
              'block w-full bg-transparent outline-none',
              'py-[calc(theme(spacing[2.5]))] sm:py-[calc(theme(spacing[1.5]))]',
            ])}
          />
        ) : (
          <div
            className={clsx([
              'block w-full cursor-default truncate',
              'py-[calc(theme(spacing[2.5]))] sm:py-[calc(theme(spacing[1.5]))]',
            ])}
            onClick={() => setIsEditing(true)}
          >
            {task.done ? <s>{task.text || '\u00A0'}</s> : task.text || '\u00A0'}
          </div>
        )}
        {!task.done && (
          <Dropdown>
            <DropdownButton plain aria-label="More options">
              <EllipsisHorizontalIcon />
            </DropdownButton>
            <DropdownMenu anchor="bottom end">
              <DropdownSection aria-label="Reorder">
                <DropdownHeading>Reorder</DropdownHeading>
                <DropdownItem
                  disabled={taskIndex === 0}
                  onClick={moveTaskToTop}
                >
                  <ArrowUpIcon />
                  <DropdownLabel>Move to top</DropdownLabel>
                </DropdownItem>
                <DropdownItem disabled={taskIndex === 0} onClick={moveTaskUp}>
                  <ArrowUpIcon />
                  <DropdownLabel>Move up</DropdownLabel>
                </DropdownItem>
                <DropdownItem
                  disabled={taskIndex === listLength - 1}
                  onClick={moveTaskDown}
                >
                  <ArrowDownIcon />
                  <DropdownLabel>Move down</DropdownLabel>
                </DropdownItem>
                <DropdownItem
                  disabled={taskIndex === listLength - 1}
                  onClick={moveTaskToBottom}
                >
                  <ArrowDownIcon />
                  <DropdownLabel>Move to bottom</DropdownLabel>
                </DropdownItem>
              </DropdownSection>
              <DropdownDivider />
              <DropdownSection aria-label="Move to">
                <DropdownHeading>Move to</DropdownHeading>
                {present.map(
                  (list) =>
                    list.id !== listId && (
                      <DropdownItem
                        key={list.id}
                        onClick={() => moveTaskToList(list.id)}
                      >
                        <ListBulletIcon />
                        <DropdownLabel>{list.name}</DropdownLabel>
                      </DropdownItem>
                    ),
                )}
              </DropdownSection>
              <DropdownDivider />
              <DropdownItem onClick={deleteTask}>
                <TrashIcon />
                <DropdownLabel>Delete task</DropdownLabel>
                <DropdownShortcut keys="⌘X" />
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
    </li>
  );
};
