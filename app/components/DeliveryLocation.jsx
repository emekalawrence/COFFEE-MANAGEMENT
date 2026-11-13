import { useEffect, useRef, useState } from "react";
import "./DeliveryLocation.css";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [-29.31, 27.48];

function DeliveryLocation({ value, onChange }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const marker = useRef(null);
  const leafletRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Update the marker and map position.
  function updateMap(lat, lng, L) {
    if (!mapInstance.current) return;

    const position = [lat, lng];

    mapInstance.current.setView(position, 16);

    if (marker.current) {
      marker.current.setLatLng(position);
    } else {
      marker.current = L.circleMarker(position, {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#765139",
        fillOpacity: 1,
      }).addTo(mapInstance.current);
    }
  }

  // Ask the backend to convert coordinates into an address.
  async function getAddress(lat, lng, L) {
    setLoading(true);
    setMessage("Finding your address...");

    try {
      const response = await fetch(
        `/api/location/reverse?lat=${lat}&lon=${lng}`,
      );

      if (!response.ok) {
        throw new Error("Address lookup failed");
      }

      const data = await response.json();

      onChange({
        address: data.address,
        coordinates: {
          lat,
          lng,
        },
      });

      setMessage("Location selected successfully.");
    } catch (error) {
      setMessage("Could not find the address. You can enter it manually.");
    } finally {
      setLoading(false);
    }
  }

  // Initialize the map only in the browser.
  useEffect(() => {
    let map;
    let leaflet;
    let cancelled = false;

    async function initializeMap() {
      const L = await import("leaflet");
      leafletRef.current = L;

      if (cancelled || !mapElement.current) return;

      leaflet = L;

      map = L.map(mapElement.current).setView(DEFAULT_CENTER, 12);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on("click", async (event) => {
        const { lat, lng } = event.latlng;

        updateMap(lat, lng, L);

        onChange({
          address: "",
          coordinates: { lat, lng },
        });

        await getAddress(lat, lng, L);
      });

      mapInstance.current = map;
      setMapReady(true);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (map) {
        map.remove();
      }

      mapInstance.current = null;
      marker.current = null;
    };
  }, []);

  // Update marker when a location is selected.
  useEffect(() => {
    if (mapReady && leafletRef.current && value?.coordinates) {
      const { lat, lng } = value.coordinates;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updateMap(lat, lng, leafletRef.current);
      }
    }
  }, [mapReady, value]);

  function leafletCoordinatesAreValid(coords) {
    return Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng);
  }

  // Request the customer's current location.
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access.");
      return;
    }

    setMessage("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const L = await import("leaflet");

        updateMap(lat, lng, L);

        onChange({
          address: "",
          coordinates: { lat, lng },
        });

        await getAddress(lat, lng, L);
      },
      (error) => {
        setMessage(
          error.code === 1
            ? "Location permission was denied. Enter your address manually."
            : "Unable to get your location. Try again or enter your address manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <section className="delivery-location">
      <h3>Delivery Location</h3>

      <p>
        Select your delivery location on the map or use your current location.
      </p>

      <button
        type="button"
        className="location-button"
        onClick={getCurrentLocation}
        disabled={loading}
      >
        {loading ? "Finding location..." : "Use my current location"}
      </button>

      <div ref={mapElement} className="delivery-map" />

      <label className="delivery-address">
        Delivery address
        <textarea
          value={value?.address || ""}
          onChange={(event) =>
            onChange({
              ...value,
              address: event.target.value,
            })
          }
          placeholder="Enter your street, area or nearby landmark"
          rows={3}
          required
        />
      </label>

      {message && (
        <p className="location-message" role="status">
          {message}
        </p>
      )}

      <small>
        Map data © OpenStreetMap contributors. Click the map to adjust your
        location.
      </small>
    </section>
  );
}

export default DeliveryLocation;
