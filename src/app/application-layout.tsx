'use client';

import {
  Description,
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from '@/components/catalyst/fieldset';
import { Input } from '@/components/catalyst/input';
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
import { Text } from '@/components/catalyst/text';
import { ActaMachinaIcon, GitHubIcon } from '@/components/icons';
import { ApiKeyContext } from '@/contexts/api-key';
import { ArrowUturnLeftIcon as ArrowUturnLeftIcon20 } from '@heroicons/react/20/solid';
import { useState } from 'react';

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState(false);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        setApiKey,
        apiKeyError,
        setApiKeyError,
      }}
    >
      <SidebarStackedLayout
        navbar={
          <Navbar>
            <NavbarSpacer />
            <NavbarSection>
              <NavbarItem
                href="https://actamachina.com/demos"
                aria-label="Back to Demos"
              >
                <ArrowUturnLeftIcon20 />
              </NavbarItem>
              <NavbarItem
                href="https://github.com/tlyleung/technical-phone-screen"
                aria-label="GitHub Repository"
              >
                <GitHubIcon />
              </NavbarItem>
            </NavbarSection>
          </Navbar>
        }
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <SidebarSection>
                <SidebarItem
                  href="https://actamachina.com"
                  aria-label="Acta Machina"
                >
                  <span className="inline-grid size-8 shrink-0 rounded-full bg-zinc-900 p-1.5 align-middle text-white outline outline-1 -outline-offset-1 outline-black/[--ring-opacity] [--avatar-radius:20%] [--ring-opacity:20%] *:col-start-1 *:row-start-1 *:rounded-full dark:bg-white dark:text-black dark:outline-white/[--ring-opacity]">
                    <ActaMachinaIcon />
                  </span>
                  <SidebarLabel>Acta Machina</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarHeader>
            <SidebarBody>
              <SidebarSection>
                <SidebarHeading>Overview</SidebarHeading>
                <Text className="px-2">
                  AI-powered kanban board that helps you generate subtasks and
                  distribute tasks across lists.
                </Text>
              </SidebarSection>
              <SidebarSection>
                <SidebarHeading>Settings</SidebarHeading>
                <Fieldset className="px-2">
                  <FieldGroup>
                    <Field>
                      <Label>Anthropic API Key</Label>
                      <Input
                        name="api_key"
                        value={apiKey}
                        invalid={apiKeyError}
                        onChange={(e) => setApiKey(e.target.value)}
                        onFocus={() => setApiKeyError(false)}
                      />
                      {apiKeyError && (
                        <ErrorMessage>Invalid Anthropic API Key</ErrorMessage>
                      )}
                      {!apiKeyError && (
                        <Description>
                          Claude 3.5 Haiku costs are approximately 0.4¢ per
                          KTok.
                        </Description>
                      )}
                    </Field>
                  </FieldGroup>
                </Fieldset>
              </SidebarSection>
              <SidebarSection className="lists-portals"></SidebarSection>
            </SidebarBody>
            <SidebarFooter>
              <SidebarSection>
                <SidebarItem
                  href="https://actamachina.com/demos"
                  aria-label="Back to Demos"
                >
                  <ArrowUturnLeftIcon20 />
                  <SidebarLabel>Back to Demos</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  href="https://github.com/tlyleung/technical-phone-screen"
                  aria-label="GitHub Repository"
                >
                  <GitHubIcon />
                  <SidebarLabel>GitHub Repository</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarFooter>
          </Sidebar>
        }
      >
        {children}
      </SidebarStackedLayout>
    </ApiKeyContext.Provider>
  );
}
