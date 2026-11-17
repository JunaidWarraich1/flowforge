import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/executionStore';
import { useCanvasStore } from '../stores/canvasStore';
import { executionsApi } from '../api/executions';
import { WebSocketMessage } from '../types';

export const useExecutionWebSocket = (executionId: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

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
    const wsBase =
      import.meta.env.VITE_WS_URL || 'wss://flowforge-orpin.vercel.app/api/v1/ws';
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

        const startPollingFallback = () => {
          if (pollIntervalRef.current) return;
          pollIntervalRef.current = window.setInterval(async () => {
            const state = useExecutionStore.getState();
            if (!state.isRunning || state.activeExecutionId !== executionId) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              return;
            }
            try {
              const exec = await executionsApi.getById(executionId);
              updateExecutionStatus(
                exec.status,
                exec.started_at ?? undefined,
                exec.finished_at ?? undefined,
                exec.error ?? undefined
              );
              (exec.node_executions || []).forEach((ne) => {
                updateNodeStatus({
                  node_id: ne.node_id,
                  status: ne.status,
                  input_data: ne.input_data,
                  output_data: ne.output_data,
                  duration_ms: ne.duration_ms ?? undefined,
                  error: ne.error ?? undefined,
                });
                updateCanvasNodeStatus(ne.node_id, ne.status, {
                  input_data: ne.input_data,
                  output_data: ne.output_data,
                  duration_ms: ne.duration_ms ?? undefined,
                  error: ne.error ?? undefined,
                });
              });
              if (
                exec.status === 'completed' ||
                exec.status === 'failed' ||
                exec.status === 'cancelled'
              ) {
                completeExecution(exec.status, exec.finished_at ?? undefined);
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
              }
            } catch (err) {
              // Ignore polling errors
            }
          }, 2000);
        };

        ws.onclose = () => {
          // Reconnect if execution still active or start polling
          const state = useExecutionStore.getState();
          if (state.activeExecutionId === executionId && state.isRunning) {
            reconnectTimeoutRef.current = window.setTimeout(connect, 2500);
            startPollingFallback();
          }
        };

        ws.onerror = () => {
          startPollingFallback();
          ws.close();
        };
      } catch (err) {
        // WS init failed, fallback to polling
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
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
