import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CommandCenter } from "@/features/command/CommandCenter";

function App() {
  const [booted, setBooted] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Quick telemetry calibration sequence
    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          setIsReady(true);
          return 1;
        }
        return prev + 0.25;
      });
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {!booted && (
        <LoadingScreen
          progress={loadProgress}
          isReady={isReady}
          onComplete={() => setBooted(true)}
        />
      )}
      <CommandCenter />
    </>
  );
}

export default App;
