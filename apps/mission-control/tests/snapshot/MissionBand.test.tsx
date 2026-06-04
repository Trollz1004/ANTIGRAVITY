import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MissionBand } from '../../src/components/MissionBand';

describe('MissionBand', () => {
  it('renders correctly', () => {
    const { container } = render(<MissionBand />);
    expect(container).toMatchSnapshot();
  });
});
