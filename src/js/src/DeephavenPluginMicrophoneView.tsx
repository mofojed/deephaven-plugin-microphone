import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "@deephaven/jsapi-bootstrap";
import Log from "@deephaven/log";
import { WidgetComponentProps } from "@deephaven/plugin";
import { dh as DhType } from "@deephaven/jsapi-types";
import {
  ActionButton,
  Icon,
  LoadingSpinner,
  View,
} from "@deephaven/components";
import { vsMic, vsMicFilled } from "@deephaven/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const log = Log.module(
  "deephaven-plugin-microphone.DeephavenPluginMicrophoneView"
);

export function DeephavenPluginMicrophoneView(
  props: WidgetComponentProps
): JSX.Element {
  const { fetch } = props;
  const [widget, setWidget] = useState<DhType.Widget | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isRecording = recorder != null;
  const dh = useApi();

  useEffect(() => {
    async function init() {
      // Fetch the widget from the server
      const fetched_widget = (await fetch()) as DhType.Widget;
      setWidget(fetched_widget);
    }

    init();
  }, [dh, fetch]);

  const startRecording = useCallback(async () => {
    try {
      // Open up the microphone and start recording
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 12000 },
      });
      const recorder = new MediaRecorder(stream);
      // TODO: Use a timeslice value here to send chunks as they come in rather than send it all at once
      // recorder.start(50);
      recorder.start();
      recorder.ondataavailable = (e) => {
        log.debug("Recording data available");

        // Send the recorded audio to the server
        const reader = new FileReader();
        reader.onload = async () => {
          setIsPending(true);
          const data = reader.result as ArrayBuffer;
          await widget?.sendMessage(data);
        };
        reader.readAsArrayBuffer(e.data);
      };

      recorder.onstop = async () => {
        log.debug("Recording stopped");

        stream.getTracks().forEach((track) => track.stop());
      };

      setRecorder(recorder);
    } catch (e) {
      log.error("Error starting recording", e);
    }
  }, [widget]);

  const stopRecording = useCallback(() => {
    if (!recorder) {
      return;
    }

    recorder.stop();
    setRecorder(null);
  }, [recorder]);

  useEffect(
    function listenForResponse() {
      if (!widget) {
        return;
      }

      const cleanup = widget.addEventListener<DhType.Widget>(
        dh.Widget.EVENT_MESSAGE,
        ({ detail }) => {
          const message = detail.getDataAsString();
          log.debug("Received message:", message);
          if (message.length > 0) {
            log.warn("Unexpected content in message:", message);
          }

          // We've received a message acknowledging the audio has been processed
          setIsPending(false);
        }
      );

      return () => {
        cleanup();
      };
    },
    [widget]
  );

  return (
    <View>
      <ActionButton
        aria-label="Voice command"
        onPressStart={startRecording}
        onPressEnd={stopRecording}
        onBlur={stopRecording}
        isDisabled={isPending}
        UNSAFE_style={{
          color: isRecording ? "var(--dh-color-visual-red)" : undefined,
        }}
      >
        {isPending ? (
          <LoadingSpinner />
        ) : (
          <Icon>
            <FontAwesomeIcon icon={isRecording ? vsMicFilled : vsMic} />
          </Icon>
        )}
      </ActionButton>
    </View>
  );
}

export default DeephavenPluginMicrophoneView;
