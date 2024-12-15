export type Action =
  | { type: 'board/undo' }
  | { type: 'board/redo' }
  | { type: 'list/cleared'; listId: string }
  | { type: 'list/deleted'; listId: string }
  | { type: 'list/inserted'; onListInserted?: (list: List) => void }
  | { type: 'list/moved'; startIndex: number; endIndex: number }
  | { type: 'list/renamed'; listId: string; name: string }
  | { type: 'task/deleted'; listId: string; taskId: string }
  | {
      type: 'task/inserted';
      listId: string;
      parentId?: string;
      previousId?: string;
      onTaskInserted?: (task: Task) => void;
    }
  | {
      type: 'task/moved';
      listId: string;
      taskId: string;
      parentId?: string;
      previousId?: string;
      destinationListId?: string;
    }
  | { type: 'task/renamed'; listId: string; taskId: string; text: string }
  | { type: 'task/toggled'; listId: string; taskId: string };

export type History = {
  past: Array<Board>;
  present: Board;
  future: Array<Board>;
};

export type Board = List[];

export type List = {
  id: string;
  name: string;
  uncompletedTasks: Task[];
  completedTasks: Task[];
};

export type ListData = {
  type: 'list';
  listId: string;
  listIndex: number;
};

export type Task = {
  id: string;
  text: string;
  children: Task[];
};

export type TaskData = {
  type: 'task';
  taskId: string;
  taskAncestorIds: string[];
  taskParentId: string | null;
  taskPreviousId: string | null;
  taskNextId: string | null;
  listId: string;
};
