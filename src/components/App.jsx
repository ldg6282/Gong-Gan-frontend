import IframeLoader from "./IframeLoader";
import Header from "./Header";

export default function App() {
  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen bg-white">
      <Header className="h-16" />
      <div className="flex-grow w-full">
        <IframeLoader />
      </div>
    </div>
  );
}
