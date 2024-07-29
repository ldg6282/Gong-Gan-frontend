import IframeLoader from "./IframeLoader";
import Header from "./Header";

export default function App({ roomId }) {
  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen bg-white">
      <Header className="h-16" roomId={roomId} />
      <div className="flex-grow w-full">
        <IframeLoader roomId={roomId} />
      </div>
    </div>
  );
}
