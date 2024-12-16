import { Badge } from '@/components/catalyst/badge';
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
import {
  TaskData as TaskDataType,
  Task as TaskType,
} from '@/systems/kanban/types';
import {
  Instruction,
  attachInstruction,
  extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { Input } from '@headlessui/react';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTurnDownRightIcon,
  ArrowUpIcon,
  EllipsisHorizontalIcon,
  ListBulletIcon,
  TrashIcon,
} from '@heroicons/react/16/solid';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';

import { findTask } from '../context';

type DragState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'preview'; container: HTMLElement };

type DropState =
  | { type: 'idle' }
  | { type: 'is-task-over'; instruction: Instruction | null };

function countDescendants(task: TaskType): number {
  return task.children.reduce(
    (count, child) => count + 1 + countDescendants(child),
    0,
  );
}

export const Task = ({
  task,
  index,
  listId,
  ancestorIds,
  previousId,
  nextId,
  isCompleted,
  editingTaskId,
  setEditingTaskId,
}: {
  task: TaskType;
  index: number;
  listId: string;
  ancestorIds: string[];
  previousId: string | null;
  nextId: string | null;
  isCompleted: boolean;
  editingTaskId: string | null;
  setEditingTaskId: (taskId: string | null) => void;
}) => {
  const taskId = task.id;

  const isEditing = editingTaskId === taskId;
  const currentLevel = ancestorIds.length;
  const grandparentId =
    ancestorIds.length > 1 ? ancestorIds[ancestorIds.length - 2] : null;
  const parentId =
    ancestorIds.length > 0 ? ancestorIds[ancestorIds.length - 1] : null;
  const descendantCount = useMemo(() => countDescendants(task), [task]);

  const taskRef = useRef<HTMLLIElement>(null);

  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [dropState, setDropState] = useState<DropState>({ type: 'idle' });
  const [text, setText] = useState<string>(task.text);

  const { present: lists } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  /*
   * Indent actions
   */

  // Move task to become the last child of its previous sibling
  const indentTask = () => {
    invariant(previousId, 'Task has no previous sibling');

    const list = lists.find((list) => list.id === listId);
    invariant(list, 'List not found');

    const previousSibling = findTask(list.uncompletedTasks, previousId);
    invariant(previousSibling, 'Previous sibling not found');

    const previousSiblingLastChildId =
      previousSibling.children.length > 0
        ? previousSibling.children[previousSibling.children.length - 1].id
        : undefined;

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      parentId: previousId,
      previousId: previousSiblingLastChildId,
      destinationListId: listId,
    });
  };

  // Move task to become its parent's next sibling
  const unindentTask = () => {
    invariant(parentId, 'Task has no parent');

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      parentId: grandparentId ?? undefined,
      previousId: parentId,
      destinationListId: listId,
    });
  };

  /*
   * Reorder actions
   */

  const moveTaskToTop = () => {
    invariant(currentLevel > 0 || previousId, 'Already at the top');

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      destinationListId: listId,
    });
  };

  const moveTaskUp = () => {
    invariant(previousId, 'Task has no previous sibling');

    const list = lists.find((list) => list.id === listId);
    invariant(list, 'List not found');

    let siblings = list.uncompletedTasks;
    if (parentId) {
      const parent = findTask(list.uncompletedTasks, parentId);
      invariant(parent, 'Parent not found');
      siblings = parent.children;
    }

    const previousPreviousSibling = index > 1 ? siblings[index - 2] : null;

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      previousId: previousPreviousSibling?.id ?? undefined,
      destinationListId: listId,
    });
  };

  const moveTaskDown = () => {
    invariant(nextId, 'Task has no next sibling');

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      previousId: nextId,
      destinationListId: listId,
    });
  };

  const moveTaskToBottom = () => {
    invariant(currentLevel > 0 || nextId, 'Already at the bottom');

    const list = lists.find((list) => list.id === listId);
    invariant(list, 'List not found');

    const previousId =
      list.uncompletedTasks.length > 0
        ? list.uncompletedTasks[list.uncompletedTasks.length - 1].id
        : undefined;

    dispatch({
      type: 'task/moved',
      listId,
      taskId,
      previousId,
      destinationListId: listId,
    });
  };

  /*
   * Move to list actions
   */

  const moveTaskToList = (toListId: string) => {
    dispatch({
      type: 'task/moved',
      listId: listId,
      taskId,
      destinationListId: toListId,
    });
  };

  /*
   * Other actions
   */

  const addSubtask = () =>
    dispatch({
      type: 'task/inserted',
      listId,
      parentId: taskId,
      onTaskInserted: (newTask) => setEditingTaskId(newTask.id),
    });

  const deleteTask = () => dispatch({ type: 'task/deleted', listId, taskId });

  const renameTask = () => {
    if (text !== task.text) {
      dispatch({ type: 'task/renamed', listId, taskId, text });
      setEditingTaskId(null);
    }
  };

  const toggleTask = () => dispatch({ type: 'task/toggled', listId, taskId });

  // Set up draggable and drop target for task
  useEffect(() => {
    invariant(taskRef.current);

    if (isCompleted || isEditing) return;

    const data: TaskDataType = {
      type: 'task',
      taskId,
      taskAncestorIds: ancestorIds,
      taskParentId: parentId,
      taskPreviousId: previousId,
      taskNextId: nextId,
      listId,
    };

    return combine(
      draggable({
        element: taskRef.current,
        canDrag: () => !(isCompleted || isEditing),
        getInitialData: () => data,
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render({ container }) {
              setDragState({ type: 'preview', container });
              return () => setDragState({ type: 'is-dragging' });
            },
            nativeSetDragImage,
          });
        },

        onDragStart: () => setDragState({ type: 'is-dragging' }),
        onDrop: () => setDragState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: taskRef.current,
        canDrop: (args) => args.source.data.type === 'task',
        getData: ({ input, element }) => {
          const mode =
            task.children.length > 0
              ? 'expanded'
              : nextId
                ? 'standard'
                : 'last-in-group';
          return attachInstruction(data, {
            input,
            element,
            currentLevel,
            indentPerLevel: 24,
            mode,
            block: ['reparent'],
          });
        },
        getIsSticky: () => true,
        onDragEnter: (args) => {
          const instruction = extractInstruction(args.self.data);
          setDropState({ type: 'is-task-over', instruction });
        },
        onDrag: (args) => {
          const instruction = extractInstruction(args.self.data);
          setDropState({ type: 'is-task-over', instruction });
        },
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
    );
  }, [
    taskId,
    isEditing,
    isCompleted,
    task.children.length,
    ancestorIds,
    previousId,
    nextId,
    currentLevel,
    listId,
    parentId,
  ]);

  return (
    <>
      <li
        ref={taskRef}
        data-testid={`task-${taskId}`}
        className={clsx([
          'relative -mt-0.5',
          !isCompleted && 'cursor-grab active:cursor-grabbing',
          // Hover state
          'hover:bg-zinc-950/5 dark:hover:bg-white/10',
          dropState.type === 'is-task-over' &&
            dropState.instruction?.type === 'make-child' &&
            'bg-blue-500/10',
        ])}
      >
        <div
          className={clsx([
            // Basic layout
            'flex items-center gap-2',
            // Drop indicator
            'border-b-2 border-t-2 border-transparent',
            dropState.type === 'is-task-over' &&
              dropState.instruction?.type === 'reorder-above' &&
              'border-t-blue-500',
            dropState.type === 'is-task-over' &&
              dropState.instruction?.type === 'reorder-below' &&
              'border-b-blue-500',
            // Dragging state
            dragState.type === 'is-dragging' && 'opacity-50',
          ])}
          style={{
            marginLeft: `${0.75 + currentLevel * 1.5}rem`,
            marginRight: '0.75rem',
          }}
        >
          <Checkbox checked={isCompleted} onChange={toggleTask} />
          {isEditing ? (
            <Input
              data-testid="task-input"
              autoFocus
              type="text"
              value={text}
              placeholder="Task name"
              onChange={(e) => setText(e.target.value)}
              onBlur={renameTask}
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              onKeyDown={(e) => e.key === 'Enter' && renameTask()}
              className={clsx([
                'block w-full bg-transparent outline-none',
                'py-[calc(theme(spacing[2.5]))] sm:py-[calc(theme(spacing[1.5]))]',
              ])}
            />
          ) : (
            <div
              data-testid="task-text"
              className={clsx([
                'block w-full truncate',
                'py-[calc(theme(spacing[2.5]))] sm:py-[calc(theme(spacing[1.5]))]',
              ])}
              onClick={() => setEditingTaskId(taskId)}
            >
              {isCompleted ? (
                <s>{task.text || '\u00A0'}</s>
              ) : (
                task.text || '\u00A0'
              )}
            </div>
          )}
          {!isCompleted && (
            <Dropdown>
              <DropdownButton
                plain
                aria-label="More options"
                data-testid={`more-options-button-${taskId}`}
              >
                <EllipsisHorizontalIcon />
              </DropdownButton>
              <DropdownMenu
                anchor="bottom end"
                data-testid={`more-options-menu-${taskId}`}
              >
                <DropdownSection aria-label="Reorder">
                  <DropdownHeading>Indent</DropdownHeading>
                  <DropdownItem disabled={!previousId} onClick={indentTask}>
                    <ArrowRightIcon />
                    <DropdownLabel>Indent</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem disabled={!parentId} onClick={unindentTask}>
                    <ArrowLeftIcon />
                    <DropdownLabel>Unindent</DropdownLabel>
                  </DropdownItem>
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection aria-label="Reorder">
                  <DropdownHeading>Reorder</DropdownHeading>
                  <DropdownItem
                    disabled={currentLevel === 0 && !previousId}
                    onClick={moveTaskToTop}
                  >
                    <ArrowUpIcon />
                    <DropdownLabel>Move to top</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem disabled={!previousId} onClick={moveTaskUp}>
                    <ArrowUpIcon />
                    <DropdownLabel>Move up</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem disabled={!nextId} onClick={moveTaskDown}>
                    <ArrowDownIcon />
                    <DropdownLabel>Move down</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem
                    disabled={currentLevel === 0 && !nextId}
                    onClick={moveTaskToBottom}
                  >
                    <ArrowDownIcon />
                    <DropdownLabel>Move to bottom</DropdownLabel>
                  </DropdownItem>
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection aria-label="Move to">
                  <DropdownHeading>Move to</DropdownHeading>
                  {lists.map(
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
                <DropdownItem onClick={addSubtask}>
                  <ArrowTurnDownRightIcon />
                  <DropdownLabel>Add subtask</DropdownLabel>
                  <DropdownShortcut keys="⌘X" />
                </DropdownItem>
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
      {dragState.type === 'preview' &&
        createPortal(
          <div className="flex items-center space-x-2 rounded-lg bg-white p-2 text-base/6 text-zinc-950 sm:text-sm/6 dark:bg-zinc-900 dark:text-white">
            <span>{task.text}</span>
            {descendantCount > 0 && (
              <Badge color="blue">+{descendantCount}</Badge>
            )}
          </div>,
          dragState.container,
        )}
      {task.children.map((child, index) => (
        <Task
          key={child.id}
          task={child}
          index={index}
          listId={listId}
          ancestorIds={[...ancestorIds, task.id]}
          previousId={task.children[index - 1]?.id ?? null}
          nextId={task.children[index + 1]?.id ?? null}
          isCompleted={isCompleted}
          editingTaskId={editingTaskId}
          setEditingTaskId={setEditingTaskId}
        />
      ))}
    </>
  );
};
