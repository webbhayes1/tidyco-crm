'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AddressComponents {
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface Prediction {
  description: string;
  place_id: string;
}

// Declare google types
declare global {
  interface Window {
    google?: typeof google;
    initGooglePlaces?: () => void;
  }
}

// Track script loading state globally
let isScriptLoaded = false;
let isScriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (isScriptLoading) {
      return;
    }

    isScriptLoading = true;

    window.initGooglePlaces = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Places script');
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

function parseAddressComponents(place: google.maps.places.PlaceResult): AddressComponents {
  const components: AddressComponents = {
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    zipCode: '',
    fullAddress: place.formatted_address || '',
  };

  if (!place.address_components) return components;

  for (const component of place.address_components) {
    const types = component.types;

    if (types.includes('street_number')) {
      components.streetNumber = component.long_name;
    } else if (types.includes('route')) {
      components.streetName = component.long_name;
    } else if (types.includes('locality')) {
      components.city = component.long_name;
    } else if (types.includes('sublocality_level_1') && !components.city) {
      components.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      components.state = component.short_name;
    } else if (types.includes('postal_code')) {
      components.zipCode = component.long_name;
    }
  }

  return components;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  required = false,
  className = '',
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no-key'>('loading');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Places
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      setStatus('no-key');
      return;
    }

    loadGooglePlacesScript(apiKey).then(() => {
      if (window.google?.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // PlacesService needs a DOM element or map
        const div = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(div);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'us' },
        types: ['address'],
      },
      (results, searchStatus) => {
        if (searchStatus === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(
            results.map((r) => ({
              description: r.description,
              place_id: r.place_id,
            }))
          );
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setHighlightedIndex(-1);

    // Debounce the search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (status === 'ready') {
      debounceTimerRef.current = setTimeout(() => {
        searchPlaces(newValue);
      }, 300);
    }
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address'],
      },
      (place, detailStatus) => {
        if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
          const components = parseAddressComponents(place);
          const streetAddress = components.streetNumber
            ? `${components.streetNumber} ${components.streetName}`
            : components.streetName;

          setInputValue(streetAddress);
          onChange(streetAddress);
          onAddressSelect?.(components);
        }
        setPredictions([]);
        setShowDropdown(false);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectPrediction(predictions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const baseClassName =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${baseClassName} ${className}`}
        autoComplete="off"
      />

      {showDropdown && predictions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              {prediction.description}
            </li>
          ))}
        </ul>
      )}

      {status === 'no-key' && (
        <p className="text-xs text-amber-600 mt-1">
          Address autocomplete unavailable (API key not configured)
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-1">Address autocomplete failed to load</p>
      )}
    </div>
  );
}
