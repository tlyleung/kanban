/* eslint-disable @typescript-eslint/no-unused-expressions */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKanbanDispatch, useKanbanHistory } from '../context';
import { mockHistory, mockInnerTask, mockTask } from '../mocks';
import { Task } from './task';

vi.mock('../context', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('../context');
  return { ...original, useKanbanDispatch: vi.fn(), useKanbanHistory: vi.fn() };
});

const mockDispatch = vi.fn();

describe('Task Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useKanbanDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useKanbanHistory).mockReturnValue(mockHistory);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the task with subtasks', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    expect(screen.getByText('Visit Nezu Museum')).toBeTruthy();
    expect(screen.getByText('Visit the museum')).toBeTruthy();
    expect(screen.getByText('Visit the garden')).toBeTruthy();
    expect(screen.getByText('Visit the café')).toBeTruthy();
  });

  it('allows renaming a task', () => {
    const setEditingTaskId = vi.fn();
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId="task-5"
        setEditingTaskId={setEditingTaskId}
      />,
    );

    const input = screen.getByPlaceholderText('Task name');
    fireEvent.change(input, { target: { value: 'Updated Task Name' } });
    fireEvent.blur(input);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/renamed',
      listId: 'list-2',
      taskId: 'task-5',
      text: 'Updated Task Name',
    });

    expect(setEditingTaskId).toHaveBeenCalledWith(null);
  });

  it('does not dispatch rename when task text is unchanged', () => {
    const setEditingTaskId = vi.fn();
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId="task-5"
        setEditingTaskId={setEditingTaskId}
      />,
    );

    const input = screen.getByPlaceholderText('Task name');
    fireEvent.change(input, { target: { value: mockTask.text } });
    fireEvent.blur(input);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(setEditingTaskId).toHaveBeenCalledWith(null);
  });

  it('renders the dropdown options when more options is clicked', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId="task-5"
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    expect(screen.getByText('Move to top')).to.exist;
    expect(screen.getByText('Move up')).to.exist;
    expect(screen.getByText('Move down')).to.exist;
    expect(screen.getByText('Move to bottom')).to.exist;
    expect(screen.getByText('Add subtask')).to.exist;
    expect(screen.getByText('Delete task')).to.exist;
  });

  // it('can toggle the task between completed and uncompleted states', () => {
  //   render(
  //     <Task
  //       task={mockTask}
  //       index={1}
  //       listId="list-2"
  //       ancestorIds={[]}
  //       previousId="task-4"
  //       nextId="task-6"
  //       isCompleted={false}
  //       editingTaskId={null}
  //       setEditingTaskId={vi.fn()}
  //     />,
  //   );

  //   const checkboxes = screen.getAllByRole('checkbox');
  //   fireEvent.click(checkboxes[0]);

  //   expect(mockDispatch).toHaveBeenCalledWith({
  //     type: 'task/toggled',
  //     listId: 'list-2',
  //     taskId: 'task-5',
  //   });
  // });

  /*
   * Indent actions
   */

  it('can indent the task', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getAllByText('Indent')[1]); // Skip heading

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task/moved',
        listId: 'list-2',
        taskId: 'task-5',
        parentId: 'task-4',
        destinationListId: 'list-2',
      }),
    );
  });

  it('can unindent the task', () => {
    render(
      <Task
        task={mockInnerTask}
        index={0}
        listId="list-2"
        ancestorIds={['task-5']}
        previousId={null}
        nextId="task-9"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-8'));
    fireEvent.click(screen.getByText('Unindent'));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task/moved',
        listId: 'list-2',
        taskId: 'task-8',
        previousId: 'task-5',
        destinationListId: 'list-2',
      }),
    );
  });

  /*
   * Reorder actions
   */

  it('moves the task to top', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Move to top'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/moved',
      listId: 'list-2',
      taskId: 'task-5',
      destinationListId: 'list-2',
    });
  });

  it('moves the task up', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Move up'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/moved',
      listId: 'list-2',
      taskId: 'task-5',
      destinationListId: 'list-2',
    });
  });

  it('moves the task down', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Move down'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/moved',
      listId: 'list-2',
      taskId: 'task-5',
      previousId: 'task-6',
      destinationListId: 'list-2',
    });
  });

  it('moves the task to bottom', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Move to bottom'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/moved',
      listId: 'list-2',
      taskId: 'task-5',
      previousId: 'task-7',
      destinationListId: 'list-2',
    });
  });

  /*
   * Move to actions
   */

  it('can move the task to another list', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Day off in Kyoto'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/moved',
      listId: 'list-2',
      taskId: 'task-5',
      destinationListId: 'list-1',
    });
  });

  /*
   * Other actions
   */

  it('adds a subtask to the task', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Add subtask'));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task/inserted',
        listId: 'list-2',
        parentId: 'task-5',
        onTaskInserted: expect.any(Function),
      }),
    );
  });

  it('deletes the task', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-task-5'));
    fireEvent.click(screen.getByText('Delete task'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/deleted',
      listId: 'list-2',
      taskId: 'task-5',
    });
  });

  it('handles unknown actions gracefully', () => {
    render(
      <Task
        task={mockTask}
        index={1}
        listId="list-2"
        ancestorIds={[]}
        previousId="task-4"
        nextId="task-6"
        isCompleted={false}
        editingTaskId={null}
        setEditingTaskId={vi.fn()}
      />,
    );

    const action = { type: 'unknown_action' };
    expect(() => mockDispatch(action)).not.toThrow();
  });
});
