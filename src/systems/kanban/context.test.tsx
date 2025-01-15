import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { KanbanProvider, useKanbanDispatch, useKanbanHistory } from './context';
import { mockBoard } from './mocks';
import type { Action, Board } from './types';

function useTestHooks() {
  const history = useKanbanHistory();
  const dispatch = useKanbanDispatch();
  return { history, dispatch };
}

describe('KanbanProvider', () => {
  let dispatch: React.Dispatch<Action>;
  let getHistory: () => { past: Board[]; present: Board; future: Board[] };

  beforeEach(() => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <KanbanProvider board={mockBoard}>{children}</KanbanProvider>
    );
    const { result } = renderHook(() => useTestHooks(), { wrapper });

    // Store dispatch and a getter for history so we can call them directly in tests
    dispatch = result.current.dispatch;
    getHistory = () => result.current.history;
  });

  /*
   * Board actions
   */

  it('should initialize the board', () => {
    const { past, present: lists, future } = getHistory();
    expect(lists).toEqual(mockBoard);
    expect(past).toEqual([]);
    expect(future).toEqual([]);
  });

  it('should undo a board action', () => {
    // Rename a list
    act(() => {
      dispatch({
        type: 'list/renamed',
        listId: 'list-1',
        name: 'Kyoto Adventure',
      });
    });

    let { past, present: lists, future } = getHistory();
    expect(lists[0].name).toBe('Kyoto Adventure');
    expect(past.length).toBe(1);
    expect(future.length).toBe(0);

    // Undo the change
    act(() => {
      dispatch({ type: 'board/undo' });
    });

    ({ past, present: lists, future } = getHistory());
    expect(lists[0].name).toBe('Day off in Kyoto');
    expect(past.length).toBe(0);
    expect(future.length).toBe(1);
  });

  it('should handle undo with no past', () => {
    act(() => {
      dispatch({ type: 'board/undo' });
    });

    const { past, present: lists, future } = getHistory();
    expect(lists).toEqual(mockBoard);
    expect(past).toEqual([]);
    expect(future).toEqual([]);
  });

  it('should redo a board action', () => {
    act(() => {
      dispatch({
        type: 'list/renamed',
        listId: 'list-1',
        name: 'Kyoto Adventure',
      });
    });

    let { past, present: lists, future } = getHistory();
    expect(lists[0].name).toBe('Kyoto Adventure');
    expect(past.length).toBe(1);
    expect(future.length).toBe(0);

    // Undo the change
    act(() => {
      dispatch({ type: 'board/undo' });
    });

    ({ past, present: lists, future } = getHistory());
    expect(lists[0].name).toBe('Day off in Kyoto');
    expect(past.length).toBe(0);
    expect(future.length).toBe(1);

    // Redo the change
    act(() => {
      dispatch({ type: 'board/redo' });
    });

    ({ past, present: lists, future } = getHistory());
    expect(lists[0].name).toBe('Kyoto Adventure');
    expect(past.length).toBe(1);
    expect(future.length).toBe(0);
  });

  it('should handle redo with no future', () => {
    act(() => {
      dispatch({ type: 'board/redo' });
    });

    const { past, present: lists, future } = getHistory();
    expect(lists).toEqual(mockBoard);
    expect(past).toEqual([]);
    expect(future).toEqual([]);
  });

  it('should clear future after new action', () => {
    // Rename a list
    act(() => {
      dispatch({
        type: 'list/renamed',
        listId: 'list-1',
        name: 'Kyoto Adventure',
      });
    });

    // Undo the change
    act(() => {
      dispatch({ type: 'board/undo' });
    });

    // Rename a list again
    act(() => {
      dispatch({
        type: 'list/renamed',
        listId: 'list-1',
        name: 'Kyoto Adventure 2',
      });
    });

    const { past, present: lists, future } = getHistory();
    expect(lists[0].name).toBe('Kyoto Adventure 2');
    expect(past.length).toBe(1);
    expect(future.length).toBe(0);
  });

  /*
   * List actions
   */

  it('should clear a list', () => {
    act(() => {
      dispatch({ type: 'list/cleared', listId: 'list-1' });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks).toHaveLength(2);
    expect(lists[0].completedTasks).toHaveLength(0);
  });

  it('should delete a list', () => {
    act(() => {
      dispatch({ type: 'list/deleted', listId: 'list-1' });
    });

    const { present: lists } = getHistory();
    expect(lists).toHaveLength(1);
    expect(lists[0].id).toBe('list-2');
  });

  it('should insert a new list', () => {
    act(() => {
      dispatch({ type: 'list/inserted' });
    });

    const { present: lists } = getHistory();
    expect(lists).toHaveLength(3);
    expect(lists[2].name).toBe('');
  });

  it('should move a list', () => {
    act(() => {
      dispatch({ type: 'list/moved', startIndex: 0, endIndex: 1 });
    });

    const { present: lists } = getHistory();
    expect(lists[0].id).toBe('list-2');
    expect(lists[1].id).toBe('list-1');
  });

  it('should rename a list', () => {
    act(() => {
      dispatch({
        type: 'list/renamed',
        listId: 'list-1',
        name: 'Kyoto Adventure',
      });
    });

    const { present: lists } = getHistory();
    expect(lists[0].name).toBe('Kyoto Adventure');
  });

  /*
   * Task actions
   */

  it('should delete a task', () => {
    act(() => {
      dispatch({ type: 'task/deleted', listId: 'list-1', taskId: 'task-1' });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks).toHaveLength(1);
    expect(lists[0].uncompletedTasks[0].id).toBe('task-2');
  });

  it('should insert a new task', () => {
    act(() => {
      dispatch({ type: 'task/inserted', listId: 'list-1' });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks).toHaveLength(3);
    expect(lists[0].uncompletedTasks[0].text).toBe('');
  });

  it('should insert a new subtask', () => {
    act(() => {
      dispatch({ type: 'task/inserted', listId: 'list-1', parentId: 'task-1' });
    });

    const { present: lists } = getHistory();
    const parentTask = lists[0].uncompletedTasks.find(
      (task) => task.id === 'task-1',
    );
    expect(parentTask).toBeDefined();
    expect(parentTask!.children).toHaveLength(1);
    expect(parentTask!.children[0].text).toBe('');
  });

  it('should move a task within a list', () => {
    act(() => {
      dispatch({
        type: 'task/moved',
        listId: 'list-1',
        taskId: 'task-1',
        previousId: 'task-2',
      });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks[0].id).toBe('task-2');
    expect(lists[0].uncompletedTasks[1].id).toBe('task-1');
  });

  it('should move a task between lists', () => {
    act(() => {
      dispatch({
        type: 'task/moved',
        listId: 'list-1',
        taskId: 'task-1',
        destinationListId: 'list-2',
      });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks).toHaveLength(1);
    expect(lists[1].uncompletedTasks).toHaveLength(5);
    expect(lists[1].uncompletedTasks[0].id).toBe('task-1');
  });

  it('should rename a task', () => {
    act(() => {
      dispatch({
        type: 'task/renamed',
        listId: 'list-1',
        taskId: 'task-1',
        text: 'Walk the Path',
      });
    });

    const { present: lists } = getHistory();
    expect(lists[0].uncompletedTasks[0].text).toBe('Walk the Path');
  });

  it('should toggle a task from uncompleted to completed', () => {
    act(() => {
      dispatch({ type: 'task/toggled', listId: 'list-1', taskId: 'task-1' });
    });

    const { present: lists } = getHistory();
    expect(lists[0].completedTasks).toHaveLength(2);
    expect(lists[0].uncompletedTasks).toHaveLength(1);
  });

  it('should toggle a task from completed to uncompleted', () => {
    act(() => {
      dispatch({ type: 'task/toggled', listId: 'list-1', taskId: 'task-3' });
    });

    const { present: lists } = getHistory();
    expect(lists[0].completedTasks).toHaveLength(0);
    expect(lists[0].uncompletedTasks).toHaveLength(3);
  });

  /*
   * Unknown action
   */

  it('should handle an unknown action type gracefully', () => {
    act(() => {
      dispatch({ type: 'unknown/action' });
    });

    const { present: lists } = getHistory();
    expect(lists).toEqual(mockBoard);
  });
});
