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
import { useKanbanDispatch } from '@/systems/kanban/context';
import { List as ListType } from '@/systems/kanban/types';
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
  TrashIcon,
} from '@heroicons/react/16/solid';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
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
}: {
  list: ListType;
  listIndex: number;
  boardLength: number;
}) => {
  const dispatch = useKanbanDispatch();

  const listId = list.id;

  const listRef = useRef<HTMLDivElement | null>(null);
  const listInnerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollableRef = useRef<HTMLOListElement | null>(null);

  const [dragState, setDragState] = useState<DragState>({ type: 'idle' });
  const [dropState, setDropState] = useState<DropState>({ type: 'idle' });
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const addTask = () => dispatch({ type: 'task/added', listId });

  const deleteList = () => dispatch({ type: 'list/deleted', listId });

  const moveListLeft = () =>
    dispatch({
      type: 'list/moved',
      fromIndex: listIndex,
      toIndex: listIndex - 1,
    });

  const moveListRight = () =>
    dispatch({
      type: 'list/moved',
      fromIndex: listIndex,
      toIndex: listIndex + 1,
    });

  const renameList = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'list/renamed',
      listId,
      name: e.target.value,
    });
  };

  useEffect(() => {
    invariant(listRef.current);
    invariant(listInnerRef.current);
    invariant(headerRef.current);
    invariant(scrollableRef.current);

    return combine(
      autoScrollForElements({
        element: scrollableRef.current,
        canScroll: ({ source }) => source.data.type === 'task',
      }),
      draggable({
        element: listRef.current,
        dragHandle: headerRef.current,
        getInitialData: () => ({ type: 'list', listId }),
        onDragStart: () => setDragState({ type: 'is-dragging' }),
        onDrop: () => {
          setDragState({ type: 'idle' });
          setDropState({ type: 'idle' });
        },
      }),
      dropTargetForElements({
        element: listRef.current,
        getData: ({ input, element }) => {
          const data = { listId };
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
        getData: () => ({ listId }),
        canDrop: ({ source }) => source.data.type === 'task',
        getIsSticky: () => true,
        onDragEnter: () => setDropState({ type: 'is-task-over' }),
        onDragLeave: () => setDropState({ type: 'idle' }),
        onDrag: () => setDropState({ type: 'is-task-over' }),
        onDrop: () => setDropState({ type: 'idle' }),
      }),
    );
  }, [listId]);

  return (
    <div
      ref={listRef}
      className={clsx([
        // Basic layout
        'relative -ml-0.5 h-full w-full max-w-80 px-4',
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
          'relative h-full',
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
            'relative flex h-full w-full appearance-none flex-col rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
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
            className="flex items-center px-[calc(theme(spacing[3.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)]"
          >
            {isEditing ? (
              <Input
                autoFocus
                type="text"
                value={list.name}
                placeholder="List name"
                onChange={renameList}
                onBlur={() => setIsEditing(false)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-transparent font-semibold leading-8 outline-none"
              />
            ) : (
              <h1
                className="flex-1 cursor-default truncate font-semibold leading-8"
                onClick={() => setIsEditing(true)}
              >
                {list.name}
              </h1>
            )}
            <Dropdown as="div" data-slot="actions">
              <DropdownButton plain aria-label="More options">
                <EllipsisHorizontalIcon />
              </DropdownButton>
              <DropdownMenu anchor="bottom end">
                <DropdownSection>
                  <DropdownHeading>Reorder</DropdownHeading>
                  <DropdownItem
                    disabled={listIndex === 0}
                    onClick={moveListLeft}
                  >
                    <ArrowLeftIcon />
                    <DropdownLabel>Move left</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem
                    disabled={listIndex === boardLength - 1}
                    onClick={moveListRight}
                  >
                    <ArrowRightIcon />
                    <DropdownLabel>Move right</DropdownLabel>
                  </DropdownItem>
                </DropdownSection>
                <DropdownDivider />
                <DropdownItem onClick={deleteList}>
                  <TrashIcon />
                  <DropdownLabel>Delete list</DropdownLabel>
                  <DropdownShortcut keys="⌘X" />
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </header>
          <Button
            className={clsx(
              // Base layout
              'grid grid-cols-[1.125rem_1fr] items-center gap-x-2.5 gap-y-1 sm:grid-cols-[1rem_1fr]',
              // Control layout
              '[&>[data-slot=control]]:col-start-1 [&>[data-slot=control]]:row-start-1 [&>[data-slot=control]]:justify-self-center',
              // Label layout
              '[&>[data-slot=label]]:col-start-2 [&>[data-slot=label]]:row-start-1 [&>[data-slot=label]]:justify-self-start',
              // Padding
              'px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5]))] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5]))]',

              'hover:bg-zinc-950/5 dark:hover:bg-white/10',
            )}
            onClick={addTask}
          >
            <PlusIcon data-slot="control" className="h-4 w-4" />
            <label data-slot="label" className="cursor-pointer">
              Add a task
            </label>
          </Button>
          <ol
            ref={scrollableRef}
            className="flex-1 overflow-y-auto scroll-smooth pt-0.5"
          >
            {list.uncompletedTasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                taskIndex={index}
                listId={listId}
                listLength={list.uncompletedTasks.length}
              />
            ))}
            {list.completedTasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                taskIndex={index}
                listId={listId}
                listLength={list.completedTasks.length}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
