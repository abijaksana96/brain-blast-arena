import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Leaderboard } from './Leaderboard';
import { Team } from '../types';

// Mock Lucide icons to avoid render issues in test environment if needed, 
// but usually valid React components work fine. 
// If specific issues arise, we can mock them.

const mockTeams: Team[] = [
    {
        id: 'team-1',
        name: 'Alpha',
        initialScore: 0,
        roundScore: 10,
        totalScore: 150,
    },
    {
        id: 'team-2',
        name: 'Beta',
        initialScore: 0,
        roundScore: 0,
        totalScore: 80,
    }
];

describe('Leaderboard Component', () => {
    it('renders team names and scores', () => {
        render(<Leaderboard teams={mockTeams} activeTeamId={null} />);

        // Check if team names are displayed
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();

        // Check if scores are displayed
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('highlights the score with large font', () => {
        render(<Leaderboard teams={mockTeams} activeTeamId={null} />);

        const scoreElement = screen.getByText('150');
        // Check if the element has the class for large font size (text-5xl we added)
        expect(scoreElement).toHaveClass('text-5xl');
    });
});
