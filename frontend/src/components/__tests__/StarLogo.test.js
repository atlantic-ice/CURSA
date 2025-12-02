import React from 'react';
import { render, screen } from '@testing-library/react';
import StarLogo, { StarLogoGradient, StarLogoPulsing } from '../StarLogo';

// Мокаем framer-motion для избежания проблем с matchMedia
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('StarLogo', () => {
  test('renders with default props', () => {
    const { container } = render(<StarLogo />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    const { container } = render(<StarLogo size={64} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '64px', height: '64px' });
  });

  test('renders with custom color', () => {
    const { container } = render(<StarLogo color="#ff0000" />);
    
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', '#ff0000');
  });

  test('renders with glow effect when glowColor is provided', () => {
    const { container } = render(<StarLogo glowColor="#8B5CF6" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('renders animated version when animate is true', () => {
    const { container } = render(<StarLogo animate={true} />);
    
    // Motion.div создает дополнительную обертку
    const motionDiv = container.firstChild;
    expect(motionDiv).toBeInTheDocument();
  });
});

describe('StarLogoGradient', () => {
  test('renders with gradient fill', () => {
    const { container } = render(<StarLogoGradient />);
    
    const svg = container.querySelector('svg');
    const defs = svg.querySelector('defs');
    const gradient = defs.querySelector('linearGradient');
    
    expect(gradient).toBeInTheDocument();
  });

  test('renders with custom gradient colors', () => {
    const { container } = render(
      <StarLogoGradient gradientColors={['#ff0000', '#00ff00']} />
    );
    
    const stops = container.querySelectorAll('stop');
    expect(stops[0]).toHaveAttribute('stop-color', '#ff0000');
    expect(stops[1]).toHaveAttribute('stop-color', '#00ff00');
  });

  test('renders animated version when animate is true', () => {
    const { container } = render(<StarLogoGradient animate={true} />);
    
    const motionDiv = container.firstChild;
    expect(motionDiv).toBeInTheDocument();
  });
});

describe('StarLogoPulsing', () => {
  test('renders with pulsing animation', () => {
    const { container } = render(<StarLogoPulsing />);
    
    // Motion.div с анимацией
    const motionDiv = container.firstChild;
    expect(motionDiv).toBeInTheDocument();
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('renders with custom colors', () => {
    const { container } = render(
      <StarLogoPulsing color="#ffffff" glowColor="#ff0000" />
    );
    
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', '#ffffff');
  });
});
