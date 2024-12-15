'use client';

import { Board } from '@/systems/kanban/components/board';
import { KanbanProvider } from '@/systems/kanban/context';

export default function Home() {
  return (
    <KanbanProvider>
      <Board />
    </KanbanProvider>
  );
}
