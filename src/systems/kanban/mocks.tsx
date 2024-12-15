import type { Board, History, List, Task } from './types';

export const mockBoard: Board = [
  {
    id: 'list-1',
    name: 'Day off in Kyoto',
    uncompletedTasks: [
      { id: 'task-1', text: 'Philosopher’s Path', children: [] },
      { id: 'task-2', text: 'Visit the temple', children: [] },
    ],
    completedTasks: [{ id: 'task-3', text: 'Drink matcha', children: [] }],
  },
  {
    id: 'list-2',
    name: 'Day off in Tokyo',
    uncompletedTasks: [
      { id: 'task-4', text: 'Explore Shibuya Crossing', children: [] },
      {
        id: 'task-5',
        text: 'Visit Nezu Museum',
        children: [
          { id: 'task-8', text: 'Visit the museum', children: [] },
          { id: 'task-9', text: 'Visit the garden', children: [] },
          { id: 'task-10', text: 'Visit the café', children: [] },
        ],
      },
      { id: 'task-6', text: 'Climb Tokyo Skytree', children: [] },
      { id: 'task-7', text: 'Visit Akihabara', children: [] },
    ],
    completedTasks: [],
  },
];

export const mockHistory: History = {
  past: [],
  present: mockBoard,
  future: [],
};

export const mockList: List = mockBoard[0];

export const mockTask: Task = mockBoard[1].uncompletedTasks[1];

export const mockInnerTask: Task = mockBoard[1].uncompletedTasks[1].children[0];
