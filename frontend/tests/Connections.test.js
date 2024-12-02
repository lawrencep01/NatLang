// Connections.test.js
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Connections from '../src/components/Connections';
import { ConnectionContext } from '../src/contexts/ConnectionContext';
import api from '../src/services/api';

jest.mock('../src/services/api');

const mockConnections = [
  {
    id: 1,
    name: 'PostgreSQL',
    database: 'postgres',
    host: 'localhost',
    port: 5432,
  },
  {
    id: 2,
    name: 'MySQL',
    database: 'mysql',
    host: 'localhost',
    port: 3306,
  },
];

describe('Connections Component', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockConnections });
  });

  const renderComponent = () => {
    const setConnectionId = jest.fn();
    render(
      <ConnectionContext.Provider value={{ connectionId: null, setConnectionId }}>
        <Connections />
      </ConnectionContext.Provider>
    );
    return { setConnectionId };
  };

  test('fetches and displays connections', async () => {
    renderComponent();
    expect(api.get).toHaveBeenCalledWith('/connections');
    await waitFor(() => {
      mockConnections.forEach((conn) => {
        expect(screen.getByText(conn.name)).toBeInTheDocument();
        expect(screen.getByText(`${conn.database} (ID: ${conn.id})`)).toBeInTheDocument();
        expect(screen.getByText(`${conn.host}: ${conn.port}`)).toBeInTheDocument();
      });
    });
  });

  test('handles connection selection', async () => {
    const { setConnectionId } = renderComponent();
    const postgresElement = await screen.findByText('PostgreSQL');
    fireEvent.click(postgresElement);
    expect(setConnectionId).toHaveBeenCalledWith(1);
  });

  test('displays error message on fetch failure', async () => {
    api.get.mockRejectedValueOnce(new Error('Fetch error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch connections.')).toBeInTheDocument();
    });
  });
});