// ConnectionContext.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ConnectionProvider, ConnectionContext } from '../src/contexts/ConnectionContext';

describe('ConnectionContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides initial connectionId from localStorage', () => {
    localStorage.setItem('connectionId', JSON.stringify('test-id'));

    let connectionId;
    render(
      <ConnectionProvider>
        <ConnectionContext.Consumer>
          {(value) => {
            connectionId = value.connectionId;
            return null;
          }}
        </ConnectionContext.Consumer>
      </ConnectionProvider>
    );

    expect(connectionId).toBe('test-id');
  });

  test('updates connectionId and saves to localStorage', () => {
    let setConnectionId;
    render(
      <ConnectionProvider>
        <ConnectionContext.Consumer>
          {(value) => {
            setConnectionId = value.setConnectionId;
            return null;
          }}
        </ConnectionContext.Consumer>
      </ConnectionProvider>
    );

    act(() => {
      setConnectionId('new-id');
    });

    expect(localStorage.getItem('connectionId')).toBe(JSON.stringify('new-id'));
  });

  test('provides updated connectionId to consumers', () => {
    let setConnectionId;
    render(
      <ConnectionProvider>
        <ConnectionContext.Consumer>
          {(value) => {
            setConnectionId = value.setConnectionId;
            return null;
          }}
        </ConnectionContext.Consumer>
      </ConnectionProvider>
    );

    act(() => {
      setConnectionId('updated-id');
    });

    let connectionId;
    render(
      <ConnectionProvider>
        <ConnectionContext.Consumer>
          {(value) => {
            connectionId = value.connectionId;
            return null;
          }}
        </ConnectionContext.Consumer>
      </ConnectionProvider>
    );

    expect(connectionId).toBe('updated-id');
  });
});