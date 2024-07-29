import { useAtom } from "jotai";
import { LuMic, LuMicOff } from "react-icons/lu";
import { HiMagnifyingGlassMinus, HiMagnifyingGlassPlus } from "react-icons/hi2";
import { VscUnmute, VscMute } from "react-icons/vsc";
import { PiPencilSimpleDuotone, PiPencilSimpleSlashDuotone } from "react-icons/pi";
import { IoMdColorFill } from "react-icons/io";
import { RiSketching } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import {
  soundButtonAtom,
  micButtonAtom,
  zoomScaleAtom,
  volumeAtom,
  micVolumeAtom,
  seletedColorAtom,
  penToolAtom,
} from "../atoms/atoms";

export default function ButtonGroup() {
  const [isSoundButtonVisible, setIsSoundButtonVisible] = useAtom(soundButtonAtom);
  const [isMicButtonVisible, setIsMicButtonVisible] = useAtom(micButtonAtom);
  const [, setScale] = useAtom(zoomScaleAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [micVolume, setMicVolume] = useAtom(micVolumeAtom);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [previousMicVolume, setPreviousMicVolume] = useState(50);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [showMicVolumeBar, setShowMicVolumeBar] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useAtom(seletedColorAtom);
  const [isPenToolActive, setIsPenToolActive] = useAtom(penToolAtom);
  const colorPickerRef = useRef(null);

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

  function handlePenClick() {
    setIsPenToolActive(!isPenToolActive);
  }

  function handleColorChange(color) {
    setSelectedColor(color);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex space-x-2">
      <div
        className="relative"
        onMouseEnter={() => setShowVolumeBar(true)}
        onMouseLeave={() => setShowVolumeBar(false)}
      >
        <button
          type="button"
          className="p-2"
          onClick={handleSoundButtonClick}
          aria-label={isSoundButtonVisible ? "Mute sound" : "Unmute sound"}
        >
          {isSoundButtonVisible ? <VscUnmute size={20} /> : <VscMute color="#D2042D" size={20} />}
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
          className="p-2"
          onClick={handleMicButtonClick}
          aria-label={isMicButtonVisible ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicButtonVisible ? <LuMic size={20} /> : <LuMicOff color="#D2042D" size={20} />}
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
      <div className="relative" ref={colorPickerRef}>
        <button
          type="button"
          className="p-2"
          onClick={handlePenClick}
          aria-label={isPenToolActive ? "Deactivate pen tool" : "Activate pen tool"}
        >
          {isPenToolActive ? (
            <PiPencilSimpleDuotone size={20} />
          ) : (
            <PiPencilSimpleSlashDuotone color="#D2042D" size={20} />
          )}
        </button>
      </div>
      <div className="relative" ref={colorPickerRef}>
        <button
          type="button"
          className="p-2"
          onClick={() => setShowColorPicker(true)}
          aria-label="color picker"
        >
          <IoMdColorFill color={selectedColor} size={20} />
        </button>
        {showColorPicker && (
          <ColorPickerPopup
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </div>
      <button type="button" className="p-2 pl-12" onClick={zoomOut} aria-label="Zoom out">
        <HiMagnifyingGlassMinus size={20} />
      </button>
      <button type="button" className="p-2" onClick={zoomReset} aria-label="Reset zoom">
        초기화
      </button>
      <button type="button" className="p-2" onClick={zoomIn} aria-label="Zoom in">
        <HiMagnifyingGlassPlus size={20} />
      </button>
    </div>
  );
}

function ColorPickerPopup({ selectedColor, onColorChange }) {
  const colors = ["#00FFFF", "#00FF80", "#FFFF00", "#FF00FF", "#FF9900", "#8000FF"];

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-white border rounded shadow-lg z-50">
      <div className="flex flex-col items-center">
        <RiSketching size={120} style={{ color: selectedColor }} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <button
              type="button"
              key={color}
              className="w-8 h-8 p-3 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              aria-label="selected color"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
