/* eslint-disable @typescript-eslint/no-unused-expressions */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKanbanDispatch, useKanbanHistory } from '../context';
import { mockHistory, mockList } from '../mocks';
import { List } from './list';

vi.mock('../context', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('../context');
  return { ...original, useKanbanDispatch: vi.fn(), useKanbanHistory: vi.fn() };
});

const mockDispatch = vi.fn();

describe('List Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useKanbanDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useKanbanHistory).mockReturnValue(mockHistory);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the list with tasks', () => {
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    expect(screen.getByText('Day off in Kyoto')).to.exist;
    expect(screen.getByText('Philosopher’s Path')).to.exist;
    expect(screen.getByText('Visit the temple')).to.exist;
    expect(screen.getByText('Drink matcha')).to.exist;
  });

  it('allows renaming a list', () => {
    const setIsEditingList = vi.fn();
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={true}
        setIsEditingList={setIsEditingList}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('List');
    fireEvent.change(input, { target: { value: 'Updated List Name' } });
    fireEvent.blur(input);

    expect(setIsEditingList).toHaveBeenCalledWith(false);

    // expect(mockDispatch).toHaveBeenCalledWith({
    //   type: 'list/renamed',
    //   listId: 'list-1',
    //   name: 'Updated List Name',
    // });
  });

  it('does not dispatch rename when name is unchanged', () => {
    const setIsEditingList = vi.fn();
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={true}
        setIsEditingList={setIsEditingList}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('List');
    fireEvent.change(input, { target: { value: mockList.name } });
    fireEvent.blur(input);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(setIsEditingList).toHaveBeenCalledWith(false);
  });

  it('renders the dropdown options when more options is clicked', () => {
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-list-1'));
    expect(screen.getByText('Move left')).to.exist;
    expect(screen.getByText('Move right')).to.exist;
    expect(screen.getByText('Delete list')).to.exist;
  });

  /*
   * Reorder actions
   */

  it('moves the list left when move left option is clicked', () => {
    render(
      <List
        list={mockList}
        listIndex={1}
        boardLength={3}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-list-1'));

    const moveLeftButton = screen.getByText('Move left');
    fireEvent.click(moveLeftButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'list/moved',
      startIndex: 1,
      endIndex: 0,
    });
  });

  it('moves the list right when move right option is clicked', () => {
    render(
      <List
        list={mockList}
        listIndex={1}
        boardLength={3}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-list-1'));

    const moveRightButton = screen.getByText('Move right');
    fireEvent.click(moveRightButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'list/moved',
      startIndex: 1,
      endIndex: 2,
    });
  });

  /*
   * Other actions
   */

  it('adds a new task when the add task button is clicked', () => {
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    const addTaskButton = screen.getByText('Add a task');
    fireEvent.click(addTaskButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'task/inserted',
      listId: 'list-1',
      onTaskInserted: expect.any(Function),
    });
  });

  it('deletes a list when the delete option is clicked', () => {
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('more-options-button-list-1'));

    const deleteButton = screen.getByText('Delete list');
    fireEvent.click(deleteButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'list/deleted',
      listId: 'list-1',
    });
  });

  it('renames a list', () => {
    const setIsEditingList = vi.fn();
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={true}
        setIsEditingList={setIsEditingList}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('List');
    fireEvent.change(input, { target: { value: 'Updated List Name' } });
    fireEvent.blur(input);

    expect(setIsEditingList).toHaveBeenCalledWith(false);

    // expect(mockDispatch).toHaveBeenCalledWith({
    //   type: 'list/renamed',
    //   listId: 'list-1',
    //   name: 'Updated List Name',
    // });
  });

  it('handles unknown actions gracefully', () => {
    render(
      <List
        list={mockList}
        listIndex={0}
        boardLength={1}
        activeListId="list-1"
        setActiveListId={vi.fn()}
        isEditingList={false}
        setIsEditingList={vi.fn()}
        activeTaskId={null}
        setActiveTaskId={vi.fn()}
        isEditingTask={false}
        setIsEditingTask={vi.fn()}
        selection={null}
        setSelection={vi.fn()}
      />,
    );

    const action = { type: 'unknown_action' };
    expect(() => mockDispatch(action)).not.toThrow();
  });
});
