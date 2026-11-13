import { useEffect, useState } from "react";

function Typewriter({ text = "", speed = 100 }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const characters = Array.from(text);

    if (!characters.length) {
      setDisplay("");
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return undefined;
    }

    let index = 0;
    const typingSpeed = Math.max(Number(speed) || 75, 20);
    setDisplay("");

    const timer = window.setInterval(() => {
      if (index < characters.length) {
        setDisplay(characters.slice(0, index + 1).join(""));
        index += 1;
      } else {
        window.clearInterval(timer);
      }
    }, typingSpeed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <h1 className="typewriter" aria-label={text}>
      <span aria-hidden="true">{display}</span>
      <span className="cursor" aria-hidden="true">|</span>
    </h1>
  );
}

export default Typewriter;
