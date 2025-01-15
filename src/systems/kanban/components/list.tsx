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
import { useApiKey } from '@/contexts/api-key';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import {
  ListData as ListDataType,
  List as ListType,
} from '@/systems/kanban/types';
import type { Task as TaskType } from '@/systems/kanban/types';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
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
import { Button, Input } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/16/solid';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import invariant from 'tiny-invariant';

import { Task } from './task';

type DragState = { type: 'idle' } | { type: 'is-dragging' };

type DropState =
  | { type: 'idle' }
  | { type: 'is-list-over'; closestEdge: Edge | null }
  | { type: 'is-task-over' };

export const List = ({
  list,
  listIndex,
  boardLength,
  activeListId,
  setActiveListId,
  isEditingList,
  setIsEditingList,
  activeTaskId,
  setActiveTaskId,
  isEditingTask,
  setIsEditingTask,
  selection,
  setSelection,
}: {
  list: ListType;
  listIndex: number;
  boardLength: number;
  activeListId: string | null;
  setActiveListId: (listId: string | null) => void;
  isEditingList: boolean;
  setIsEditingList: (isEditing: boolean) => void;
  activeTaskId: string | null;
  setActiveTaskId: (taskId: string | null) => void;
  isEditingTask: boolean;
  setIsEditingTask: (isEditing: boolean) => void;
  selection: 'start' | 'end' | null;
  setSelection: (selection: 'start' | 'end' | null) => void;
}) => {
  const listId = list.id;

  const isActive = listId === activeListId;
  const isEditing = listId === activeListId && isEditingList;

  const listRef = useRef<HTMLDivElement | null>(null);
  const listInnerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollableRef = useRef<HTMLOListElement | null>(null);

  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [dropState, setDropState] = useState<DropState>({ type: 'idle' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState<string>(list.name);

  const { apiKey, setApiKeyError } = useApiKey();
  const { present: lists } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  const taskIds = (() => {
    function flattenTasks(tasks: TaskType[]): string[] {
      return tasks.reduce<string[]>((acc, task) => {
        acc.push(task.id);
        if (task.children.length > 0) {
          acc.push(...flattenTasks(task.children));
        }
        return acc;
      }, []);
    }

    const uncompletedTaskIds = flattenTasks(list.uncompletedTasks);
    const completedTaskIds = flattenTasks(list.completedTasks);
    return [...uncompletedTaskIds, ...completedTaskIds];
  })();

  /*
   * AI actions
   */

  const distributeTasks = async () => {
    if (!apiKey) {
      setApiKeyError(true);
      return;
    }

    setIsGenerating(true);

    const listIds = lists.map((list) => list.id);
    const listNames = lists.map((list) => list.name);
    const taskIds = list.uncompletedTasks.map((task) => task.id); // top-level tasks only
    const taskTexts = list.uncompletedTasks.map((task) => task.text); // top-level tasks only

    try {
      // Call the tasks/categorize API for each task
      const destinationListIds = await Promise.all(
        taskTexts.map(async (taskText) => {
          const response = await fetch('/api/tasks/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listNames, taskText, apiKey }),
          });
          const destinationListName = await response.json();
          const index = listNames.indexOf(destinationListName);
          return index !== -1 ? listIds[index] : listId; // Default to current list if no match
        }),
      );

      dispatch({
        type: 'list/distributed',
        listId,
        taskIds,
        destinationListIds,
      });
    } catch (error) {
      console.error('Error distributing tasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /*
   * Reorder actions
   */

  const moveListLeft = () =>
    dispatch({
      type: 'list/moved',
      startIndex: listIndex,
      endIndex: listIndex - 1,
    });

  const moveListRight = () =>
    dispatch({
      type: 'list/moved',
      startIndex: listIndex,
      endIndex: listIndex + 1,
    });

  /*
   * Other actions
   */

  const addTask = () =>
    dispatch({
      type: 'task/inserted',
      listId,
      onTaskInserted: (newTask) => {
        setTimeout(() => {
          setActiveTaskId(newTask.id);
          setIsEditingTask(true);
        }, 0); // Avoid bad setState on rend
      },
    });

  const deleteList = () => dispatch({ type: 'list/deleted', listId });

  /*
   * Hotkeys
   */

  useHotkeys('ctrl+tab', distributeTasks, {
    enabled: isActive,
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('enter', () => setIsEditingList(false), {
    enabled: isEditing,
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('ctrl+left', moveListLeft, {
    enabled: activeTaskId ? taskIds.includes(activeTaskId) : false,
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('ctrl+right', moveListRight, {
    enabled: activeTaskId ? taskIds.includes(activeTaskId) : false,
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('ctrl+a', addTask, {
    enabled: activeTaskId ? taskIds.includes(activeTaskId) : false,
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys('ctrl+shift+backspace', deleteList, {
    enabled: activeTaskId ? taskIds.includes(activeTaskId) : false,
    enableOnFormTags: true,
    preventDefault: true,
  });

  // Rename list when editing stops
  useEffect(() => {
    if (!isEditing) {
      if (name !== list.name) {
        dispatch({ type: 'list/renamed', listId, name });
      }
    }
  }, [isEditing, dispatch, listId, name, list.name]);

  // Set up draggable and drop target for list
  useEffect(() => {
    invariant(listRef.current);
    invariant(listInnerRef.current);
    invariant(headerRef.current);
    invariant(scrollableRef.current);

    if (isEditing || isEditingTask) return;

    const data: ListDataType = { type: 'list', listId, listIndex };

    return combine(
      autoScrollForElements({
        element: scrollableRef.current,
        canScroll: ({ source }) => source.data.type === 'task',
        getAllowedAxis: () => 'vertical',
      }),
      draggable({
        element: listRef.current,
        dragHandle: headerRef.current,
        canDrag: () => !isEditing,
        getInitialData: () => data,
        onDragStart: () => setDragState({ type: 'is-dragging' }),
        onDrop: () => {
          setDragState({ type: 'idle' });
          setDropState({ type: 'idle' });
        },
      }),
      dropTargetForElements({
        element: listRef.current,
        getData: ({ input, element }) => {
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['left', 'right'],
          });
        },
        canDrop: ({ source }) => source.data.type === 'list',
        getIsSticky: () => true,
        onDragEnter: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-list-over', closestEdge });
        },
        onDrag: (args) => {
          const closestEdge = extractClosestEdge(args.self.data);
          setDropState({ type: 'is-list-over', closestEdge });
        },
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: listInnerRef.current,
        getData: () => data,
        canDrop: ({ source }) => source.data.type === 'task',
        getIsSticky: () => true,
        onDragEnter: () => setDropState({ type: 'is-task-over' }),
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrag: () => setDropState({ type: 'is-task-over' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
    );
  }, [listId, listIndex, isEditing, isEditingTask]);

  return (
    <div
      ref={listRef}
      data-testid={`list-${listId}`}
      className={clsx([
        // Basic layout
        'relative max-h-full w-full flex-shrink-0 flex-col overflow-y-hidden px-4 lg:-ml-0.5 lg:w-80',
        // Active list
        activeListId === listId ? 'flex' : 'hidden lg:flex',
        // Generating state
        isGenerating && 'animate-pulse',
        // Drop indicator
        'border-l-2 border-r-2 border-transparent',
        dropState.type === 'is-list-over' &&
          dropState.closestEdge === 'left' &&
          'border-l-blue-500',
        dropState.type === 'is-list-over' &&
          dropState.closestEdge === 'right' &&
          'border-r-blue-500',
      ])}
    >
      <div
        className={clsx([
          // Basic layout
          'relative flex min-h-0 flex-1 flex-col',
          // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
          'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
          // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
          'dark:before:hidden',
          // Dragging state
          dragState.type === 'is-dragging' && 'opacity-50',
        ])}
      >
        <div
          ref={listInnerRef}
          className={clsx([
            // Basic layout
            'relative flex min-h-0 flex-1 appearance-none flex-col rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
            // Typography
            'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
            // Border
            'border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20',
            // Background color
            dropState.type === 'is-task-over'
              ? 'bg-zinc-950/5 dark:bg-white/10'
              : 'bg-transparent dark:bg-white/5',
          ])}
        >
          <header
            ref={headerRef}
            className="flex cursor-grab items-center px-3 active:cursor-grabbing"
          >
            {isEditing ? (
              <Input
                data-testid="list-input"
                autoFocus
                type="text"
                value={name}
                placeholder="List"
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingList(false)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-transparent font-semibold leading-8 outline-none"
              />
            ) : (
              <h1
                data-testid="list-name"
                className="flex-1 truncate font-semibold leading-8"
                onClick={() => {
                  setActiveListId(listId);
                  setIsEditingList(true);
                  setActiveTaskId(null);
                  setIsEditingTask(false);
                }}
              >
                {name}
              </h1>
            )}
            <Dropdown>
              <DropdownButton
                plain
                aria-label="More options"
                data-testid={`more-options-button-${listId}`}
              >
                <EllipsisHorizontalIcon />
              </DropdownButton>
              <DropdownMenu
                anchor="bottom end"
                data-testid={`more-options-menu-${listId}`}
              >
                <DropdownSection aria-label="AI">
                  <DropdownHeading>AI</DropdownHeading>
                  <DropdownItem onClick={distributeTasks}>
                    <SparklesIcon />
                    <DropdownLabel>Distribute tasks</DropdownLabel>
                    <DropdownShortcut keys="⌘⇥" />
                  </DropdownItem>
                </DropdownSection>
                <DropdownDivider />

                <DropdownSection aria-label="Reorder">
                  <DropdownHeading>Reorder</DropdownHeading>
                  <DropdownItem
                    disabled={listIndex === 0}
                    onClick={moveListLeft}
                  >
                    <ArrowLeftIcon />
                    <DropdownLabel>Move left</DropdownLabel>
                    <DropdownShortcut keys="⌘←" />
                  </DropdownItem>
                  <DropdownItem
                    disabled={listIndex === boardLength - 1}
                    onClick={moveListRight}
                  >
                    <ArrowRightIcon />
                    <DropdownLabel>Move right</DropdownLabel>
                    <DropdownShortcut keys="⌘→" />
                  </DropdownItem>
                </DropdownSection>
                <DropdownDivider />
                <DropdownSection aria-label="Actions">
                  <DropdownHeading>Actions</DropdownHeading>
                  <DropdownItem onClick={addTask}>
                    <PlusIcon />
                    <DropdownLabel>Add task</DropdownLabel>
                    <DropdownShortcut keys="⌘A" />
                  </DropdownItem>
                  <DropdownItem onClick={deleteList}>
                    <TrashIcon />
                    <DropdownLabel>Delete list</DropdownLabel>
                    <DropdownShortcut keys="⌘⇧⌫" />
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </header>
          <Button
            data-testid="add-task-button"
            className={clsx(
              // Base layout
              'grid grid-cols-[1.125rem_1fr] items-center gap-x-2.5 gap-y-1 sm:grid-cols-[1rem_1fr]',
              // Control layout
              '[&>[data-slot=control]]:col-start-1 [&>[data-slot=control]]:row-start-1 [&>[data-slot=control]]:justify-self-center',
              // Label layout
              '[&>[data-slot=label]]:col-start-2 [&>[data-slot=label]]:row-start-1 [&>[data-slot=label]]:justify-self-start',
              // Padding
              'px-3 py-[calc(theme(spacing[2.5]))] sm:py-[calc(theme(spacing[1.5]))]',

              'hover:bg-zinc-950/5 dark:hover:bg-white/10',
            )}
            onClick={addTask}
          >
            <PlusIcon data-slot="control" className="h-4 w-4" />
            <label data-slot="label">Add a task</label>
          </Button>
          <ol
            ref={scrollableRef}
            className="flex-1 pt-0.5"
            style={{ overflowY: 'scroll' }}
          >
            {[
              { tasks: list.uncompletedTasks, isCompleted: false },
              { tasks: list.completedTasks, isCompleted: true },
            ].map(({ tasks, isCompleted }) =>
              tasks.map((task, index) => (
                <Task
                  key={task.id + task.text}
                  task={task}
                  index={index}
                  listId={listId}
                  taskIds={taskIds}
                  ancestorIds={[]}
                  previousId={tasks[index - 1]?.id ?? null}
                  nextId={tasks[index + 1]?.id ?? null}
                  isCompleted={isCompleted}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  isEditingTask={isEditingTask}
                  setIsEditingTask={setIsEditingTask}
                  selection={selection}
                  setSelection={setSelection}
                />
              )),
            )}
          </ol>
        </div>
      </div>
    </div>
  );
};
