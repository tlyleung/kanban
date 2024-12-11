import { Avatar } from '@/components/catalyst/avatar';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/catalyst/dropdown';
import { Link } from '@/components/catalyst/link';
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from '@/components/catalyst/navbar';
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '@/components/catalyst/sidebar';
import { SidebarStackedLayout } from '@/components/catalyst/sidebar-layout';
import { useKanbanDispatch, useKanbanHistory } from '@/systems/kanban/context';
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid';
import {
  ArrowUturnLeftIcon as ArrowUturnLeftIcon20,
  ArrowUturnRightIcon as ArrowUturnRightIcon20,
  PlusIcon as PlusIcon20,
} from '@heroicons/react/20/solid';
import { usePathname } from 'next/navigation';

function AccountDropdownMenu({
  anchor,
}: {
  anchor: 'top start' | 'bottom end';
}) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#">
        <UserCircleIcon />
        <DropdownLabel>My account</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="#">
        <LightBulbIcon />
        <DropdownLabel>Share feedback</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="#">
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  );
}

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { past, present, future } = useKanbanHistory();
  const dispatch = useKanbanDispatch();

  return (
    <SidebarStackedLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar
                  src="https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                  square
                />
              </DropdownButton>
              <AccountDropdownMenu anchor="bottom end" />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar
                  initials="T1"
                  className="size-6 bg-purple-500 text-white"
                />
                <SidebarLabel>Team 1</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu
                className="min-w-80 lg:min-w-64"
                anchor="bottom start"
              >
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#">
                  <Avatar
                    slot="icon"
                    initials="T1"
                    className="bg-purple-500 text-white"
                  />
                  <DropdownLabel>Team 1</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="#">
                  <Avatar
                    slot="icon"
                    initials="T2"
                    className="bg-purple-500 text-white"
                  />
                  <DropdownLabel>Team 2</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#">
                  <PlusIcon />
                  <DropdownLabel>New team&hellip;</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="#">
                <PlusIcon20 />
                <SidebarLabel>Create new board</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Boards</SidebarHeading>
              <SidebarItem href="#" current={pathname === '/'}>
                Board 1
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src="https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                    className="size-10"
                    square
                    alt=""
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      Thomas
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      thomas@example.com
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <AccountDropdownMenu anchor="top start" />
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
      headerbar={
        <Navbar className="max-lg:hidden">
          <Link href="/" aria-label="Home">
            Board 1
          </Link>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem
              aria-label="Undo"
              disabled={past.length === 0}
              onClick={() => dispatch({ type: 'board/undo' })}
            >
              <ArrowUturnLeftIcon20 />
            </NavbarItem>
            <NavbarItem
              aria-label="Redo"
              disabled={future.length === 0}
              onClick={() => dispatch({ type: 'board/redo' })}
            >
              <ArrowUturnRightIcon20 />
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      }
    >
      {children}
    </SidebarStackedLayout>
  );
}
