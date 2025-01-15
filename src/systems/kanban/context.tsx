import { produce } from 'immer';
import { createContext, useContext, useReducer } from 'react';
import invariant from 'tiny-invariant';

import { mockBoard, mockHistory } from './mocks';
import { Action, Board, History, Task } from './types';

const HistoryContext = createContext<History>(mockHistory);
const DispatchContext = createContext<React.Dispatch<Action>>(() => {});

export const useKanbanHistory = () => useContext(HistoryContext);
export const useKanbanDispatch = () => useContext(DispatchContext);

export function KanbanProvider({
  children,
  board,
}: {
  children: React.ReactNode;
  board?: Board;
}) {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: board ?? mockBoard,
    future: [],
  });

  return (
    <HistoryContext.Provider value={history}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </HistoryContext.Provider>
  );
}

function historyReducer(history: History, action: Action): History {
  console.log('historyReducer', history, action);

  const { past, present, future } = history;
  switch (action.type) {
    case 'board/undo': {
      if (past.length === 0) return history;
      return {
        past: past.slice(0, -1),
        present: past[past.length - 1],
        future: [present, ...future],
      };
    }

    case 'board/redo': {
      if (future.length === 0) return history;
      return {
        past: [...past, present],
        present: future[0],
        future: future.slice(1),
      };
    }

    default: {
      const updatedBoard = boardReducer(present, action);
      return {
        past: [...past, present],
        present: updatedBoard,
        future: [],
      };
    }
  }
}

function deleteTask(tasks: Task[], taskId: string): Task | null {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) return tasks.splice(i, 1)[0];
    const childTask = deleteTask(tasks[i].children, taskId);
    if (childTask) return childTask;
  }
  return null;
}

export function findTask(tasks: Task[], taskId: string): Task | null {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    const found = findTask(task.children, taskId);
    if (found) return found;
  }
  return null;
}

function flattenTask(task: Task): Task[] {
  const flat = [{ ...task, children: [] as Task[] }];
  for (const child of task.children ?? []) {
    flat.push(...flattenTask(child));
  }
  return flat;
}

function boardReducer(board: Board, action: Action): Board {
  return produce(board, (lists: Board) => {
    switch (action.type) {
      case 'list/cleared': {
        const { listId } = action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');
        list.completedTasks = [];
        break;
      }

      case 'list/deleted': {
        const { listId } = action;
        return lists.filter((list) => list.id !== listId);
      }

      case 'list/inserted': {
        const { onListInserted } = action;

        const newList = {
          id: crypto.randomUUID(),
          name: '',
          uncompletedTasks: [],
          completedTasks: [],
        };

        onListInserted?.(newList);

        lists.push(newList);
        break;
      }

      case 'list/moved': {
        const { startIndex, endIndex } = action;
        const [listToMove] = lists.splice(startIndex, 1);
        lists.splice(endIndex, 0, listToMove);
        break;
      }

      case 'list/renamed': {
        const { listId, name } = action;
        const list = lists.find((list) => list.id === listId);
        if (list) list.name = name;
        break;
      }

      case 'task/deleted': {
        const { listId, taskId } = action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');
        deleteTask(list.uncompletedTasks, taskId);
        deleteTask(list.completedTasks, taskId);
        break;
      }

      case 'task/inserted': {
        const { listId, parentId, previousId, onTaskInserted } = action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');

        const newTask = {
          id: crypto.randomUUID(),
          text: '',
          parentId: parentId ?? null,
          children: [],
        };

        onTaskInserted?.(newTask);

        let tasks = list.uncompletedTasks;
        if (parentId) {
          const parent = findTask(list.uncompletedTasks, parentId);
          invariant(parent, 'Parent not found');
          tasks = parent.children;
        }

        // Note: if previousId is not found, new task will be inserted at beginning
        const insertIndex = previousId
          ? tasks.findIndex((task) => task.id === previousId) + 1
          : 0;
        tasks.splice(insertIndex, 0, newTask);

        break;
      }

      case 'task/moved': {
        const { listId, taskId, parentId, previousId, destinationListId } =
          action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');

        const task = deleteTask(list.uncompletedTasks, taskId);
        invariant(task, 'Task not found');

        const destinationList = destinationListId
          ? lists.find((list) => list.id === destinationListId)
          : list;
        invariant(destinationList, 'Destination list not found');

        let tasks = destinationList.uncompletedTasks;
        if (parentId) {
          const parent = findTask(destinationList.uncompletedTasks, parentId);
          invariant(parent, 'Parent not found');
          tasks = parent.children;
        }

        // Note: if previousId is not found, new task will be inserted at beginning
        const insertIndex = previousId
          ? tasks.findIndex((task) => task.id === previousId) + 1
          : 0;
        tasks.splice(insertIndex, 0, task);
        break;
      }

      case 'task/renamed': {
        const { listId, taskId, text } = action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');

        const task = findTask(
          [...list.uncompletedTasks, ...list.completedTasks],
          taskId,
        );
        invariant(task, 'Task not found');
        task.text = text;
        break;
      }

      case 'task/toggled': {
        const { listId, taskId } = action;
        const list = lists.find((list) => list.id === listId);
        invariant(list, 'List not found');

        const uncompletedTask = deleteTask(list.uncompletedTasks, taskId);
        if (uncompletedTask) {
          const flattenedTasks = flattenTask(uncompletedTask);
          list.completedTasks.unshift(...flattenedTasks);
          break;
        }

        const completedTask = deleteTask(list.completedTasks, taskId);
        if (completedTask) {
          list.uncompletedTasks.unshift(completedTask);
          break;
        }

        break;
      }
    }
  });
}
