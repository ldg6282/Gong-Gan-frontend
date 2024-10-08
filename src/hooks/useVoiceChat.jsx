import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import {
  userIdAtom,
  micButtonAtom,
  soundButtonAtom,
  volumeAtom,
  micVolumeAtom,
  roomIdAtom,
} from "../atoms/atoms";
import useWebSocket from "./useWebSocket";

export default function useVoiceChat() {
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const [isMicActive, setIsMicActive] = useAtom(micButtonAtom);
  const [isSoundActive, setIsSoundActive] = useAtom(soundButtonAtom);
  const [volume] = useAtom(volumeAtom);
  const [micVolume] = useAtom(micVolumeAtom);
  const { sendMessage, setOnMessage, isConnected } = useWebSocket();

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);

  async function startLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    gainNodeRef.current = audioContextRef.current.createGain();

    const destination = audioContextRef.current.createMediaStreamDestination();
    source.connect(gainNodeRef.current);
    gainNodeRef.current.connect(destination);

    setMicGain(micVolume);

    setupPeerConnection(destination.stream);
  }

  function setMicGain(micVolumeValue) {
    if (gainNodeRef.current) {
      const gain = (micVolumeValue / 100) ** 3;
      gainNodeRef.current.gain.setValueAtTime(gain, audioContextRef.current.currentTime);
    }
  }

  function stopLocalStream() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function setupPeerConnection(stream) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "webrtcIceCandidate",
          candidate: event.candidate,
          roomId,
          userId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }

      const [remoteStream] = event.streams;
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play();
      remoteAudioRef.current.muted = !isSoundActive;
      remoteAudioRef.current.volume = (volume / 100) ** 2;
    };

    createAndSendOffer();
  }

  async function createAndSendOffer() {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    sendMessage({
      type: "webrtcOffer",
      offer,
      roomId,
      userId,
    });
  }

  async function handleWebRTCMessage(message) {
    if (!peerConnectionRef.current) return;

    switch (message.type) {
      case "webrtcOffer": {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(message.offer),
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        sendMessage({
          type: "webrtcAnswer",
          answer,
          roomId,
          userId,
        });
        break;
      }
      case "webrtcAnswer":
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(message.answer),
        );
        break;
      case "webrtcIceCandidate":
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    setOnMessage((event) => {
      const message = JSON.parse(event.data);
      handleWebRTCMessage(message);
    });
  }, [setOnMessage]);

  useEffect(() => {
    setIsMicActive(true);
    setIsSoundActive(true);
    startLocalStream();

    return () => {
      stopLocalStream();
    };
  }, [isConnected]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        const updatedTrack = track.clone();
        updatedTrack.enabled = isMicActive;
        localStreamRef.current.removeTrack(track);
        localStreamRef.current.addTrack(updatedTrack);
      });
    }
  }, [isMicActive]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSoundActive;
      remoteAudioRef.current.volume = (volume / 100) ** 2;
    }
  }, [isSoundActive, volume]);

  useEffect(() => {
    setMicGain(micVolume);
  }, [micVolume]);
}
