import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('preserves duplicate non-conflicting class names', () => {
    expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar');
  });

  it('resolves tailwind conflicts with twMerge', () => {
    expect(cn('px-2', 'px-4', 'text-center')).toBe('px-4 text-center');
  });
});
