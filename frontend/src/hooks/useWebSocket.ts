import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/executionStore';
import { useCanvasStore } from '../stores/canvasStore';
import { WebSocketMessage } from '../types';

export const useExecutionWebSocket = (executionId: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const { updateExecutionStatus, updateNodeStatus, completeExecution } =
    useExecutionStore();
  const { updateNodeStatus: updateCanvasNodeStatus } = useCanvasStore();

  useEffect(() => {
    if (!executionId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('flowforge_token') || '';

    // Calculate WS URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsBase =
      import.meta.env.VITE_WS_URL || `${protocol}//${host}/api/v1/ws`;
    const wsUrl = `${wsBase}/executions/${executionId}?token=${encodeURIComponent(
      token
    )}`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Connected
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case 'execution_status':
                updateExecutionStatus(
                  message.data.status,
                  message.data.started_at,
                  message.data.finished_at,
                  message.data.error
                );
                break;

              case 'node_status':
                updateNodeStatus({
                  node_id: message.data.node_id,
                  status: message.data.status,
                  input_data: message.data.input_data,
                  output_data: message.data.output_data,
                  duration_ms: message.data.duration_ms,
                  error: message.data.error,
                });

                updateCanvasNodeStatus(message.data.node_id, message.data.status, {
                  input_data: message.data.input_data,
                  output_data: message.data.output_data,
                  duration_ms: message.data.duration_ms,
                  error: message.data.error,
                });
                break;

              case 'execution_complete':
                completeExecution(message.data.status, message.data.finished_at);
                break;
            }
          } catch (e) {
            // Error parsing message
          }
        };

        ws.onclose = () => {
          // Reconnect if execution still active
          const state = useExecutionStore.getState();
          if (state.activeExecutionId === executionId && state.isRunning) {
            reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        // WS init failed
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    executionId,
    updateExecutionStatus,
    updateNodeStatus,
    completeExecution,
    updateCanvasNodeStatus,
  ]);
};
