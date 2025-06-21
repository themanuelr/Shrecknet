'use client';
import { redirect } from 'next/navigation';

export default function Page({ params }: { params: { task: string } }) {
  const map: Record<string, string> = {
    conversational: 'agent_conversational',
    'page-writer': 'agent_writer',
    'story-novelist': 'agent_novelist',
    specialist: 'agent_specialist',
  };
  const target = map[params.task] || 'agent_conversational';
  redirect(`/agents_settings/${target}`);
}
