import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VerifiedBadge, VerifiedDot, TrustScoreRing } from './VerifiedBadge';

describe('VerifiedBadge', () => {
  it('returns null for unverified tier', () => {
    const { container } = render(<VerifiedBadge tier="unverified" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders gold tier with label', () => {
    const { getByText } = render(
      <VerifiedBadge tier="gold" size="md" showLabel={true} />
    );
    expect(getByText('Verified Human')).toBeDefined();
  });

  it('renders platinum tier with label', () => {
    const { getByText } = render(
      <VerifiedBadge tier="platinum" size="md" showLabel={true} />
    );
    expect(getByText('Founding Member')).toBeDefined();
  });

  it('renders without label when showLabel is false', () => {
    const { queryByText } = render(
      <VerifiedBadge tier="gold" showLabel={false} />
    );
    expect(queryByText('Verified Human')).toBeNull();
  });

  it('renders all sizes', () => {
    const { rerender, getByText } = render(
      <VerifiedBadge tier="gold" size="sm" />
    );
    expect(getByText('Verified Human')).toBeDefined();

    rerender(<VerifiedBadge tier="gold" size="md" />);
    expect(getByText('Verified Human')).toBeDefined();

    rerender(<VerifiedBadge tier="gold" size="lg" />);
    expect(getByText('Verified Human')).toBeDefined();
  });
});

describe('VerifiedDot', () => {
  it('returns null for unverified tier', () => {
    const { container } = render(<VerifiedDot tier="unverified" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders for gold tier', () => {
    const { container } = render(<VerifiedDot tier="gold" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders for platinum tier', () => {
    const { container } = render(<VerifiedDot tier="platinum" />);
    expect(container.firstChild).not.toBeNull();
  });
});

describe('TrustScoreRing', () => {
  it('renders with default size', () => {
    const { container } = render(<TrustScoreRing score={75} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders score text', () => {
    const { getByText } = render(<TrustScoreRing score={85} />);
    expect(getByText('85')).toBeDefined();
  });

  it('renders with custom size', () => {
    const { container } = render(<TrustScoreRing score={50} size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('handles score of 0', () => {
    const { getByText } = render(<TrustScoreRing score={0} />);
    expect(getByText('0')).toBeDefined();
  });

  it('handles score of 100', () => {
    const { getByText } = render(<TrustScoreRing score={100} />);
    expect(getByText('100')).toBeDefined();
  });
});
