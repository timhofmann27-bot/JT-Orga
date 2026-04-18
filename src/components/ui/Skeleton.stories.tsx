import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, CardSkeleton, ListSkeleton } from './Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    animation: {
      control: 'select',
      options: ['pulse', 'shine'],
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'h-4 w-64',
  },
};

export const Pulse: Story = {
  args: {
    className: 'h-4 w-64',
    animation: 'pulse',
  },
};

export const Shine: Story = {
  args: {
    className: 'h-4 w-64',
    animation: 'shine',
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-80 space-y-3 p-4 bg-white/5 rounded-xl">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="w-80 space-y-4 p-4 bg-white/5 rounded-xl">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
};
