export type Action =
  | { type: 'board/undo' }
  | { type: 'board/redo' }
  | { type: 'list/deleted'; listId: number }
  | { type: 'list/moved'; fromIndex: number; toIndex: number }
  | { type: 'list/renamed'; listId: number; name: string }
  | { type: 'task/added'; listId: number }
  | { type: 'task/deleted'; taskId: number }
  | {
      type: 'task/moved';
      fromListId: number;
      fromIndex: number;
      toListId: number;
      toIndex: number;
    }
  | { type: 'task/renamed'; taskId: number; text: string }
  | { type: 'task/toggled'; taskId: number };

export type History = {
  past: Array<Board>;
  present: Board;
  future: Array<Board>;
};

export type Board = List[];

export type List = {
  id: number;
  name: string;
  uncompletedTasks: Task[];
  completedTasks: Task[];
};

export type Task = {
  id: number;
  text: string;
  done: boolean;
};
