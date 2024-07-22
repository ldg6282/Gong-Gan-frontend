import { useAtom } from "jotai";
import { LuEraser, LuMic, LuMicOff, LuPenTool } from "react-icons/lu";
import { HiMagnifyingGlassMinus, HiMagnifyingGlassPlus } from "react-icons/hi2";
import { VscUnmute, VscMute } from "react-icons/vsc";
import { useState } from "react";
import { soundButtonAtom, micButtonAtom, zoomScaleAtom } from "../atoms/atoms";

export default function ButtonGroup() {
  const [isSoundButtonVisible, setIsSoundButtonVisible] = useAtom(soundButtonAtom);
  const [isMicButtonVisible, setIsMicButtonVisible] = useAtom(micButtonAtom);
  const [, setScale] = useAtom(zoomScaleAtom);
  const [volume, setVolume] = useState(50);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [micVolume, setMicVolume] = useState(50);
  const [previousMicVolume, setPreviousMicVolume] = useState(50);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [showMicVolumeBar, setShowMicVolumeBar] = useState(false);

  function handleSoundButtonClick() {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
      setIsSoundButtonVisible(false);
    } else {
      setVolume(previousVolume);
      setIsSoundButtonVisible(true);
    }
  }

  function handleMicButtonClick() {
    if (micVolume > 0) {
      setPreviousMicVolume(micVolume);
      setMicVolume(0);
      setIsMicButtonVisible(false);
    } else {
      setMicVolume(previousMicVolume);
      setIsMicButtonVisible(true);
    }
  }

  function zoomIn() {
    setScale((prevScale) => {
      const newScale = Math.min(prevScale + 0.1, 1.2);
      return newScale;
    });
  }

  function zoomOut() {
    setScale((prevScale) => {
      const newScale = Math.max(prevScale - 0.1, 0.7);
      return newScale;
    });
  }

  function zoomReset() {
    setScale(1);
  }

  function handleVolumeBar(e) {
    const { value } = e.target;
    setVolume(value);
    setIsSoundButtonVisible(value > 0);
  }

  function handleMicVolumeBar(e) {
    const { value } = e.target;
    setMicVolume(value);
    setIsMicButtonVisible(value > 0);
  }

  return (
    <div className="flex space-x-2">
      <button type="button" className="p-2 bg-blue rounded" onClick={zoomOut} aria-label="Zoom out">
        <HiMagnifyingGlassMinus />
      </button>
      <button
        type="button"
        className="p-2 bg-blue rounded"
        onClick={zoomReset}
        aria-label="Reset zoom"
      >
        초기화
      </button>
      <button
        type="button"
        className="p-2 pr-12 bg-blue rounded"
        onClick={zoomIn}
        aria-label="Zoom in"
      >
        <HiMagnifyingGlassPlus />
      </button>
      <div
        className="relative"
        onMouseEnter={() => setShowVolumeBar(true)}
        onMouseLeave={() => setShowVolumeBar(false)}
      >
        <button
          type="button"
          className="p-2 pt-3 bg-blue rounded"
          onClick={handleSoundButtonClick}
          aria-label={isSoundButtonVisible ? "Mute sound" : "Unmute sound"}
        >
          {isSoundButtonVisible ? <VscUnmute /> : <VscMute />}
        </button>
        {showVolumeBar && (
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeBar}
            className="absolute left-1/2 top-8 w-8 transform bg-blue -translate-x-1/2 z-30"
            style={{ writingMode: "bt-lr", appearance: "slider-vertical" }}
          />
        )}
      </div>
      <div
        className="relative"
        onMouseEnter={() => setShowMicVolumeBar(true)}
        onMouseLeave={() => setShowMicVolumeBar(false)}
      >
        <button
          type="button"
          className="p-2 pt-3 bg-blue rounded"
          onClick={handleMicButtonClick}
          aria-label={isMicButtonVisible ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicButtonVisible ? <LuMic /> : <LuMicOff />}
        </button>
        {showMicVolumeBar && (
          <input
            type="range"
            min="0"
            max="100"
            value={micVolume}
            onChange={handleMicVolumeBar}
            className="absolute left-1/2 top-8 w-8 transform bg-blue -translate-x-1/2 z-30"
            style={{ writingMode: "bt-lr", appearance: "slider-vertical" }}
          />
        )}
      </div>
      <button type="button" className="p-2 bg-blue rounded" aria-label="Use pen tool">
        <LuPenTool />
      </button>
      <button type="button" className="p-2 bg-blue rounded" aria-label="Use eraser tool">
        <LuEraser />
      </button>
    </div>
  );
}
