import { createContext, useContext, useReducer } from 'react';

import { Action, Board, History, Task } from './types';

const initialBoard: Board = [
  {
    id: 1,
    name: 'Day off in Kyoto',
    uncompletedTasks: [
      { id: 1, text: 'Philosopher’s Path', done: false },
      { id: 2, text: 'Visit the temple', done: false },
      { id: 3, text: 'Drink matcha', done: false },
    ],
    completedTasks: [],
  },
  {
    id: 2,
    name: 'Day off in Tokyo',
    uncompletedTasks: [
      { id: 4, text: 'Visit Nezu Museum', done: false },
      { id: 5, text: 'Explore Shibuya Crossing', done: false },
      { id: 6, text: 'Tokyo Skytree observation deck', done: false },
      { id: 7, text: 'Visit Akihabara', done: false },
    ],
    completedTasks: [],
  },
];

const initialHistory: History = {
  past: [],
  present: initialBoard,
  future: [],
};

const HistoryContext = createContext<History>(initialHistory);
const DispatchContext = createContext<React.Dispatch<Action>>(() => {});

export const useKanbanHistory = () => useContext(HistoryContext);
export const useKanbanDispatch = () => useContext(DispatchContext);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, initialHistory);

  return (
    <HistoryContext.Provider value={history}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </HistoryContext.Provider>
  );
}

function historyReducer(history: History, action: Action): History {
  const { past, present, future } = history;

  switch (action.type) {
    case 'board/undo': {
      return {
        past: past.slice(0, -1),
        present: past[past.length - 1],
        future: [present, ...future],
      };
    }

    case 'board/redo': {
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

function boardReducer(lists: Board, action: Action): Board {
  console.log('action', action);

  switch (action.type) {
    case 'list/deleted': {
      return lists.filter((list) => list.id !== action.listId);
    }

    case 'list/moved': {
      const { fromIndex, toIndex } = action;
      const listToMove = lists[fromIndex];

      // Remove list
      const updatedLists = lists.filter((_, index) => index !== fromIndex);

      // Insert list
      updatedLists.splice(toIndex, 0, listToMove);
      return updatedLists;
    }

    case 'list/renamed': {
      return lists.map((list) =>
        list.id === action.listId ? { ...list, name: action.name } : list,
      );
    }

    case 'task/added': {
      // Add a new task to the specified list
      return lists.map((list) =>
        list.id === action.listId
          ? {
              ...list,
              uncompletedTasks: [
                { id: Date.now(), text: 'New task', done: false },
                ...list.uncompletedTasks,
              ],
            }
          : list,
      );
    }

    case 'task/deleted': {
      // Remove the task with the specified ID
      return lists.map((list) => ({
        ...list,
        uncompletedTasks: list.uncompletedTasks.filter(
          (task) => task.id !== action.taskId,
        ),
        completedTasks: list.completedTasks.filter(
          (task) => task.id !== action.taskId,
        ),
      }));
    }

    case 'task/moved': {
      const { fromListId, fromIndex, toListId, toIndex } = action;

      let taskToMove: Task;

      // Remove the task from its current list
      const updatedLists = lists.map((list) => {
        if (list.id === fromListId) {
          taskToMove = list.uncompletedTasks[fromIndex]; // TODO: bounds check
          return {
            ...list,
            uncompletedTasks: list.uncompletedTasks.filter(
              (task) => task.id !== taskToMove.id,
            ),
          };
        }
        return list;
      });

      // Add the task to the new list at the specified index
      return updatedLists.map((list) => {
        if (list.id === toListId) {
          const updatedUncompletedTasks = [...list.uncompletedTasks];
          updatedUncompletedTasks.splice(toIndex, 0, taskToMove); // Insert task at the desired position
          return { ...list, uncompletedTasks: updatedUncompletedTasks };
        }
        return list;
      });
    }

    case 'task/renamed': {
      // Update the text of the specified task
      return lists.map((list) => ({
        ...list,
        uncompletedTasks: list.uncompletedTasks.map((task) =>
          task.id === action.taskId ? { ...task, text: action.text } : task,
        ),
        completedTasks: list.completedTasks.map((task) =>
          task.id === action.taskId ? { ...task, text: action.text } : task,
        ),
      }));
    }

    case 'task/toggled': {
      // Toggle the "done" status of the specified task
      return lists.map((list) => {
        const taskInUncompleted = list.uncompletedTasks.find(
          (task) => task.id === action.taskId,
        );
        const taskInCompleted = list.completedTasks.find(
          (task) => task.id === action.taskId,
        );

        if (taskInUncompleted) {
          // Move task from uncompleted to completed
          return {
            ...list,
            uncompletedTasks: list.uncompletedTasks.filter(
              (task) => task.id !== action.taskId,
            ),
            completedTasks: [
              { ...taskInUncompleted, done: true },
              ...list.completedTasks,
            ],
          };
        } else if (taskInCompleted) {
          // Move task from completed to uncompleted
          return {
            ...list,
            uncompletedTasks: [
              { ...taskInCompleted, done: false },
              ...list.uncompletedTasks,
            ],
            completedTasks: list.completedTasks.filter(
              (task) => task.id !== action.taskId,
            ),
          };
        }

        return list; // No changes if task not found
      });
    }

    default: {
      return lists;
    }
  }
}
