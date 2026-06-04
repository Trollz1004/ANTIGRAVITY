import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Footer } from '../../src/components/Footer';

describe('Footer', () => {
  it('renders correctly', () => {
    const { container } = render(<Footer />);
    expect(container).toMatchSnapshot();
  });
});
