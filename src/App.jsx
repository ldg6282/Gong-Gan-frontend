import IframeLoader from "./components/IframeLoader";
import Header from "./components/Header";
import "./index.css";

export default function App() {
  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen bg-white z-50">
      <Header className="h-16" />
      <div className="flex-grow w-full">
        <IframeLoader />
      </div>
    </div>
  );
}
