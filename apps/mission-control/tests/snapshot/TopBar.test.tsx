import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TopBar } from '../../src/components/TopBar';

describe('TopBar', () => {
  it('renders correctly', () => {
    const { container } = render(<TopBar />);
    expect(container).toMatchSnapshot();
  });
});
