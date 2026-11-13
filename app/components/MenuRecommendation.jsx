import { useState } from "react";
import "./MenuRecommendation.css";

const preferences = [
  {
    id: "coffee",
    label: "Coffee & espresso",
    keywords: ["coffee", "espresso", "latte", "cappuccino", "mocha", "americano", "macchiato"],
  },
  {
    id: "refreshing",
    label: "Cold & refreshing",
    keywords: ["iced", "cold", "smoothie", "juice", "drink", "frappe", "lemonade", "milkshake", "tea", "soda"],
  },
  {
    id: "sweet",
    label: "A sweet treat",
    keywords: ["pastry", "pastries", "cake", "muffin", "cookie", "croissant", "donut", "doughnut", "dessert", "brownie", "tart"],
  },
  {
    id: "savory",
    label: "Something savory",
    keywords: ["sandwich", "toast", "wrap", "salad", "burger", "breakfast", "lunch", "panini", "chicken", "egg", "savory", "savoury"],
  },
  {
    id: "surprise",
    label: "Surprise me",
    keywords: [],
  },
];

function getRecommendation(items, preference) {
  const availableItems = items.filter((item) => item.available !== false);

  if (!availableItems.length) {
    return null;
  }

  if (preference.id === "surprise") {
    return {
      item: availableItems[Math.floor(Math.random() * availableItems.length)],
      matched: true,
    };
  }

  const rankedItems = availableItems
    .map((item) => {
      const searchableText = `${item.name} ${item.category || ""} ${item.description || ""}`.toLowerCase();
      const score = preference.keywords.reduce(
        (total, keyword) => total + (searchableText.includes(keyword) ? 1 : 0),
        0,
      );

      return { item, score };
    })
    .sort((left, right) => right.score - left.score);

  return {
    item: rankedItems[0].item,
    matched: rankedItems[0].score > 0,
  };
}

function MenuRecommendation({ items = [], loading = false, onAddToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  const choosePreference = (preference) => {
    setSelectedPreference(preference.id);
    setRecommendation(getRecommendation(items, preference));
  };

  return (
    <section className={`menu-recommendation ${isOpen ? "is-open" : ""}`}>
      <div className="recommendation-intro">
        <div className="recommendation-spark" aria-hidden="true">✦</div>
        <div>
          <p className="recommendation-eyebrow">Not sure what to order?</p>
          <h2>We can help you choose.</h2>
        </div>
        <button
          className="recommendation-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="menu-recommendation-panel"
          disabled={loading}
          onClick={() => setIsOpen((open) => !open)}
        >
          {loading ? "Loading menu…" : isOpen ? "Close" : "Help me choose"}
        </button>
      </div>

      {isOpen && (
        <div className="recommendation-panel" id="menu-recommendation-panel">
          <h3>What are you in the mood for?</h3>
          <div className="recommendation-options">
            {preferences.map((preference) => (
              <button
                className={`recommendation-option ${selectedPreference === preference.id ? "selected" : ""}`}
                type="button"
                key={preference.id}
                aria-pressed={selectedPreference === preference.id}
                onClick={() => choosePreference(preference)}
              >
                {preference.label}
              </button>
            ))}
          </div>

          {selectedPreference && !recommendation && (
            <p className="recommendation-empty" role="status">
              There are no available menu items to recommend right now.
            </p>
          )}

          {recommendation && (
            <article className="recommendation-result" aria-live="polite">
              <img
                src={recommendation.item.image || "/image/coffee.jpg"}
                alt=""
                loading="lazy"
              />
              <div className="recommendation-result-copy">
                <p className="recommendation-result-label">
                  {recommendation.matched ? "A pick for you" : "A cafe favourite"}
                </p>
                <h4>{recommendation.item.name}</h4>
                <p>{recommendation.item.description}</p>
                <strong>M{Number(recommendation.item.price).toFixed(2)}</strong>
              </div>
              <button
                className="recommendation-add-button"
                type="button"
                onClick={() => onAddToCart(recommendation.item.id)}
              >
                Add to cart
              </button>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

export default MenuRecommendation;
