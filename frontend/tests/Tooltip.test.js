// Tooltip.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from '../src/shared/Tooltip';

describe('Tooltip Component', () => {
  test('renders children correctly', () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  test('displays tooltip text on hover', () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    const tooltip = screen.getByText('Tooltip text');
    expect(tooltip).toHaveClass('opacity-0'); // Initially hidden
    fireEvent.mouseOver(screen.getByText('Hover me'));
        expect(tooltip).toHaveClass('group-hover:opacity-100'); // Visible on hover
    });

    test('hides tooltip text when not hovered', () => {
        render(
            <Tooltip text="Tooltip text">
                <button>Hover me</button>
            </Tooltip>
        );
        const tooltip = screen.getByText('Tooltip text');
        fireEvent.mouseOut(screen.getByText('Hover me'));
        expect(tooltip).toHaveClass('opacity-0'); // Hidden when not hovered
    });

    test('renders tooltip with correct text', () => {
        render(
            <Tooltip text="Correct Tooltip Text">
                <button>Hover me</button>
            </Tooltip>
        );
        expect(screen.getByText('Correct Tooltip Text')).toBeInTheDocument();
    });

    test('tooltip has correct initial classes', () => {
        render(
            <Tooltip text="Tooltip text">
                <button>Hover me</button>
            </Tooltip>
        );
        const tooltip = screen.getByText('Tooltip text');
        expect(tooltip).toHaveClass('absolute top-1/2 left-full ml-0 transform -translate-y-1/2 px-3 py-2 bg-black text-white text-xs font-normal rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50 pointer-events-none');
  });
});